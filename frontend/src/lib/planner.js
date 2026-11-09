/**
 * planner.js — rules-based itinerary generator for Sarthi.
 *
 * Takes the places a traveler selected and a trip setup, groups the places by
 * proximity (Haversine), spreads them over the requested days and lays out a
 * timed schedule: opening hours are respected, travel time is added between
 * stops, a lunch break is inserted, and day limits depend on the chosen pace.
 *
 * The generated itinerary is a plain JSON object so it can be persisted in
 * localStorage and recalculated after the traveler reorders or moves a stop.
 */
import { getDistanceInMeters } from '../utils/distance';
import { formatDate, formatNumber, getUILanguage } from '../i18n';

export const PACE_LIMITS = Object.freeze({
  relaxed: 2,
  balanced: 3,
  packed: 4,
});

export const PACE_LABELS = Object.freeze({
  relaxed: 'Relaxed',
  balanced: 'Balanced',
  packed: 'Packed',
});

export const TRAVEL_MODE_LABELS = Object.freeze({
  walk: 'walking',
  auto: 'auto-rickshaw',
  cab: 'cab',
});

export const DEFAULT_TRIP_SETUP = Object.freeze({
  days: 2,
  pace: 'balanced',
  startTime: '09:00',
  seniors: false,
  limitedWalking: false,
  kids: false,
  startDate: '',
});

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NOON = 12 * 60;
const LUNCH_FROM = 12 * 60 + 30;
const LUNCH_MINUTES = 60;
const DEFAULT_DAY_END = 19 * 60;
const KIDS_DAY_END = 16 * 60 + 30;
const MAX_DAYS = 7;

// Delhi traffic is not free-flowing: these are conservative door-to-door speeds.
const SPEEDS_M_PER_HOUR = { walk: 4500, auto: 16000, cab: 20000 };

// How much ground each site makes you cover on foot (minutes).
const IN_SITE_WALK = { low: 15, moderate: 30, high: 55 };

// Sites whose complexes are large or spread out. Anything not listed falls back
// to a duration-based heuristic in walkingEffortFor().
const WALKING_EFFORT_BY_ID = {
  'humayun-tomb': 'moderate',
  akshardham: 'high',
  'qutub-minar': 'high',
  'lotus-temple': 'low',
  'red-fort': 'high',
  'jama-masjid': 'moderate',
};

const openingHoursCache = new Map();
const durationCache = new Map();

/* ── small utilities ──────────────────────────────────────────────── */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round5 = (minutes) => Math.round(minutes / 5) * 5;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function addDaysISO(isoDate, days) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekdayFor(isoDate) {
  return WEEKDAYS[parseISODate(isoDate).getDay()];
}

export function formatDateLabel(isoDate) {
  const date = parseISODate(isoDate);
  return formatDate(date, getUILanguage(), { weekday: 'short', day: 'numeric', month: 'short' });
}

export function parseClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return 9 * 60;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return 9 * 60;
  return hours * 60 + minutes;
}

export function formatClock(totalMinutes) {
  const minutesInDay = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(minutesInDay / 60);
  const minutes = minutesInDay % 60;
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  const locale = ({ en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN' })[getUILanguage()] || 'en-IN';
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hour === 12 && h24 < 12 ? 0 : hour + (h24 >= 12 && hour < 12 ? 12 : 0), minutes));
}

export function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const localized = formatNumber(minutes, getUILanguage());
  if (minutes < 60) return `${localized} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} hr${hours > 1 ? 's' : ''}${rest ? ` ${rest} min` : ''}`;
}

export function normalizeSetup(rawSetup = {}) {
  const pace = PACE_LIMITS[rawSetup.pace] ? rawSetup.pace : 'balanced';
  return {
    days: clamp(Number(rawSetup.days) || DEFAULT_TRIP_SETUP.days, 1, MAX_DAYS),
    pace,
    startTime: /^\d{1,2}:\d{2}$/.test(String(rawSetup.startTime || ''))
      ? String(rawSetup.startTime)
      : DEFAULT_TRIP_SETUP.startTime,
    seniors: Boolean(rawSetup.seniors),
    limitedWalking: Boolean(rawSetup.limitedWalking),
    kids: Boolean(rawSetup.kids),
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(rawSetup.startDate || ''))
      ? String(rawSetup.startDate)
      : todayISO(),
  };
}

export function paceStopLimit(setup) {
  if (setup?.seniors || setup?.limitedWalking) return 2;
  return PACE_LIMITS[setup?.pace] || PACE_LIMITS.balanced;
}

/* ── monument data parsing ────────────────────────────────────────── */

/**
 * "6:00 AM – 6:00 PM (Daily)"        → one window
 * "7:00 AM – 12:00 PM, 1:30 PM – 6:30 PM" → two windows (midday closure)
 * "10:00 AM – 6:30 PM (Closed Mondays)"   → window + closed weekday
 */
export function parseOpeningHours(rawHours) {
  const key = String(rawHours || '');
  if (openingHoursCache.has(key)) return openingHoursCache.get(key);

  const windows = [];
  const rangePattern = /(\d{1,2}(?::\d{2})?)\s*([AP]M)\s*[–—\-]\s*(\d{1,2}(?::\d{2})?)\s*([AP]M)/gi;
  let match;
  while ((match = rangePattern.exec(key)) !== null) {
    const start = toMinutes(match[1], match[2]);
    const end = toMinutes(match[3], match[4]);
    if (end > start) windows.push({ open: start, close: end });
  }

  const closedWeekdays = [];
  const closedMatch = /closed\s+([a-z,\s]+?)\)/i.exec(key);
  if (closedMatch) {
    closedMatch[1]
      .split(/,|\band\b/i)
      .map((token) => token.trim().replace(/s$/i, '').toLowerCase())
      .filter(Boolean)
      .forEach((token) => closedWeekdays.push(token));
  }

  if (!windows.length) windows.push({ open: 9 * 60, close: 18 * 60 });
  windows.sort((a, b) => a.open - b.open);

  const parsed = { windows, closedWeekdays };
  openingHoursCache.set(key, parsed);
  return parsed;
}

function toMinutes(hourText, meridiem) {
  const [rawHour, rawMinute = '0'] = String(hourText).split(':');
  let hour = Number(rawHour) % 12;
  if (String(meridiem).toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(rawMinute);
}

export function isClosedOnWeekday(place, weekdayName) {
  const { closedWeekdays } = parseOpeningHours(place?.openingHours);
  const target = String(weekdayName || '').toLowerCase();
  return closedWeekdays.some((day) => target.startsWith(day.slice(0, 3)));
}

/** "1.5 – 2 Hours" → 105 minutes; "1 Hour" → 60 minutes. */
export function visitDurationMinutes(place, setup = {}) {
  const key = String(place?.avgTimeSpent || '');
  let duration = durationCache.get(key);
  if (duration === undefined) {
    const numbers = (key.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const averageHours = numbers.length
      ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length
      : 1;
    duration = clamp(round5(averageHours * 60), 45, 240);
    durationCache.set(key, duration);
  }

  // Children move through a site faster (and get restless sooner).
  if (setup.kids) duration = clamp(round5(duration * 0.7), 40, 180);
  return duration;
}

/** First rupee amount, unless the base entry is explicitly free. */
export function estimateEntryFee(rawFee) {
  const value = String(rawFee || '');
  if (/^\s*free/i.test(value)) return 0;
  const match = /₹\s*(\d+)/.exec(value);
  return match ? Number(match[1]) : 0;
}

export function walkingEffortFor(place) {
  if (place?.id && WALKING_EFFORT_BY_ID[place.id]) return WALKING_EFFORT_BY_ID[place.id];
  const duration = visitDurationMinutes(place);
  if (duration >= 150) return 'high';
  if (duration >= 85) return 'moderate';
  return 'low';
}

function inSiteWalkMinutes(effort, setup) {
  let minutes = IN_SITE_WALK[effort] ?? IN_SITE_WALK.moderate;
  if (setup.limitedWalking || setup.seniors) minutes *= 0.5;
  if (setup.kids) minutes *= 0.8;
  return Math.round(minutes);
}

function isWalkConstrained(setup) {
  return Boolean(setup?.seniors || setup?.limitedWalking);
}

/* ── proximity grouping ───────────────────────────────────────────── */

function distanceBetween(a, b) {
  if (!a?.coords || !b?.coords) return Infinity;
  return getDistanceInMeters(a.coords.lat, a.coords.lng, b.coords.lat, b.coords.lng);
}

function meanDistance(place, places) {
  if (!places.length) return Infinity;
  return places.reduce((sum, other) => sum + distanceBetween(place, other), 0) / places.length;
}

/** Farthest-point seeding: stable, deterministic, and spreads seeds out. */
function pickSeeds(places, count) {
  if (!places.length) return [];
  const lat = places.reduce((sum, p) => sum + p.coords.lat, 0) / places.length;
  const lng = places.reduce((sum, p) => sum + p.coords.lng, 0) / places.length;
  const centroid = { coords: { lat, lng } };

  const seeds = [places.reduce((best, place) =>
    distanceBetween(place, centroid) < distanceBetween(best, centroid) ? place : best
  , places[0])];

  while (seeds.length < Math.min(count, places.length)) {
    let candidate = null;
    let bestDistance = -1;
    places.forEach((place) => {
      if (seeds.includes(place)) return;
      const nearestSeed = Math.min(...seeds.map((seed) => distanceBetween(place, seed)));
      if (nearestSeed > bestDistance) {
        bestDistance = nearestSeed;
        candidate = place;
      }
    });
    if (!candidate) break;
    seeds.push(candidate);
  }

  return seeds;
}

/**
 * Split places into `dayCount` geographically tight groups. Each group is
 * capped at `perDay` stops; empty groups are topped up from the largest group.
 */
function groupByProximity(places, dayCount, perDay) {
  const seeds = pickSeeds(places, dayCount);
  const groups = seeds.map((seed) => [seed]);
  // Requesting more days than there are places is valid: pad with free days.
  while (groups.length < dayCount) groups.push([]);
  const assigned = new Set(seeds);

  const remaining = places
    .filter((place) => !assigned.has(place))
    .sort((a, b) => meanDistance(a, seeds) - meanDistance(b, seeds));

  remaining.forEach((place) => {
    const ranked = seeds
      .map((seed, index) => ({ index, distance: distanceBetween(place, seed) }))
      .sort((a, b) => a.distance - b.distance);
    const target = ranked.find((entry) => groups[entry.index].length < perDay) || ranked[0];
    groups[target.index].push(place);
  });

  // Never leave a requested day empty while another day is crowded.
  for (let index = 0; index < groups.length; index += 1) {
    if (groups[index].length) continue;
    const donor = groups
      .map((group, groupIndex) => ({ group, groupIndex }))
      .filter((entry) => entry.group.length > 1)
      .sort((a, b) => b.group.length - a.group.length)[0];
    if (!donor) break;
    const donorSeed = seeds[donor.groupIndex];
    let farthestIndex = 0;
    let farthestDistance = -1;
    donor.group.forEach((place, placeIndex) => {
      const distance = distanceBetween(place, donorSeed);
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = placeIndex;
      }
    });
    const [moved] = donor.group.splice(farthestIndex, 1);
    groups[index].push(moved);
  }

  return groups;
}

/** Greedy nearest-neighbour ordering keeps each day's travel short. */
function orderByProximity(places) {
  if (places.length <= 1) return [...places];
  const remaining = [...places];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((place, index) => {
      const distance = distanceBetween(last, place);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }
  return ordered;
}

/**
 * Order a day's stops so the schedule actually works: repeatedly take the stop
 * that can start earliest (respecting opening hours and closing time), breaking
 * ties by travel distance. This avoids walking to a site that is shut for the
 * next three hours while another one around the corner is open now.
 * For limited-walking and senior trips, high-effort sites are held back until
 * noon and then scheduled in the same way.
 */
function orderDayForSchedule(places, setup) {
  if (places.length <= 1) return [...places];

  const remaining = [...places];
  const ordered = [];
  const constrained = isWalkConstrained(setup);
  const dayLimit = setup.kids ? KIDS_DAY_END : DEFAULT_DAY_END;
  let cursor = parseClock(setup.startTime);
  let previous = null;

  while (remaining.length) {
    let bestIndex = -1;
    let bestStart = Infinity;
    let bestTravel = Infinity;

    remaining.forEach((place, index) => {
      const effort = walkingEffortFor(place);
      if (constrained && effort === 'high' && cursor < NOON) return;

      const leg = previous ? estimateTravelLeg(previous, place, setup) : { minutes: 0 };
      const arrival = cursor + leg.minutes;
      const duration = visitDurationMinutes(place, setup);
      const window = findOpeningWindow(parseOpeningHours(place.openingHours), arrival, duration);
      if (!window) return;
      if (window.start + duration > dayLimit) return;

      if (window.start < bestStart || (window.start === bestStart && leg.minutes < bestTravel)) {
        bestStart = window.start;
        bestTravel = leg.minutes;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      if (constrained && cursor < NOON && remaining.some((p) => walkingEffortFor(p) === 'high')) {
        cursor = NOON;
        continue;
      }
      // Nothing can fit today; keep the rest so buildDay can report them.
      ordered.push(...orderByProximity(remaining));
      break;
    }

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = bestStart + visitDurationMinutes(next, setup);
    previous = next;
  }

  return ordered;
}

/* ── travel legs ──────────────────────────────────────────────────── */

export function estimateTravelLeg(from, to, setup = {}) {
  const meters = distanceBetween(from, to);
  if (!Number.isFinite(meters)) {
    return { meters: 0, minutes: 0, mode: 'walk', cost: 0 };
  }

  const avoidWalking = Boolean(setup.seniors || setup.limitedWalking);
  let mode = 'walk';
  if (avoidWalking || meters > 1200) mode = meters <= 6000 ? 'auto' : 'cab';

  const speed = mode === 'walk'
    ? (setup.kids ? 3600 : SPEEDS_M_PER_HOUR.walk)
    : SPEEDS_M_PER_HOUR[mode];
  const rawMinutes = (meters / speed) * 60;
  const minutes = Math.max(mode === 'walk' ? 5 : 8, Math.ceil(rawMinutes / 5) * 5);

  let cost = 0;
  if (mode === 'auto') cost = Math.max(40, Math.ceil((meters / 1000) * 18 / 5) * 5);
  if (mode === 'cab') cost = Math.max(90, Math.ceil((meters / 1000) * 24 / 5) * 5);

  return { meters: Math.round(meters), minutes, mode, cost };
}

/* ── schedule a single day ────────────────────────────────────────── */

function placeSnapshot(place) {
  return {
    id: place.id,
    title: place.title,
    subtitle: place.subtitle || '',
    image: place.image || place.heroImage || '',
    category: place.category || '',
    city: place.city || '',
    coords: place.coords ? { lat: place.coords.lat, lng: place.coords.lng } : null,
    openingHours: place.openingHours || '',
    avgTimeSpent: place.avgTimeSpent || '',
    // Stops store the numeric fee *and* its label; keep the label so a
    // recalculation does not re-parse an already-numeric value down to ₹0.
    entryFee: place.entryFeeLabel ?? place.entryFee ?? '',
  };
}

function findOpeningWindow(openingHours, arriveMinutes, durationMinutes) {
  for (const window of openingHours.windows) {
    const start = Math.max(arriveMinutes, window.open);
    if (start + durationMinutes <= window.close) {
      return { start, waitedMinutes: start - arriveMinutes };
    }
  }
  return null;
}

function attachTravel(stops, setup) {
  stops.forEach((stop, index) => {
    const next = stops[index + 1];
    if (!next) {
      stop.travelMinutesToNext = 0;
      stop.travelMetersToNext = 0;
      stop.travelModeToNext = null;
      stop.travelCostToNext = 0;
      return;
    }
    const leg = estimateTravelLeg(stop, next, setup);
    stop.travelMinutesToNext = leg.minutes;
    stop.travelMetersToNext = leg.meters;
    stop.travelModeToNext = leg.mode;
    stop.travelCostToNext = leg.cost;
  });
}

function computeTotals(stops) {
  return stops.reduce(
    (totals, stop) => {
      totals.visitMinutes += stop.durationMinutes;
      totals.travelMinutes += stop.travelMinutesToNext || 0;
      totals.walkingMinutes += (stop.inSiteWalkMinutes || 0)
        + (stop.travelModeToNext === 'walk' ? stop.travelMinutesToNext || 0 : 0);
      totals.distanceMeters += stop.travelMetersToNext || 0;
      totals.entryFees += stop.entryFee || 0;
      totals.travelCost += stop.travelCostToNext || 0;
      return totals;
    },
    {
      stopCount: stops.length,
      visitMinutes: 0,
      travelMinutes: 0,
      walkingMinutes: 0,
      distanceMeters: 0,
      entryFees: 0,
      travelCost: 0,
    }
  );
}

/**
 * Lay out one day. `sources` are monument-like objects (fresh selections or
 * previously saved stop snapshots). In strict mode (generation) a stop that
 * cannot fit the day is returned as dropped so it can be carried to the next
 * day; in manual mode (recalculation) it is scheduled with a warning so a
 * deliberate user move is never silently discarded.
 */
function buildDay(dayMeta, sources, setup, strict) {
  const weekday = weekdayFor(dayMeta.date);
  const kidMode = setup.kids;
  const dayLimit = kidMode ? KIDS_DAY_END : DEFAULT_DAY_END;
  const constrained = isWalkConstrained(setup);
  const startMinutes = parseClock(setup.startTime);

  let cursor = startMinutes;
  let lunch = null;
  let previousStop = null;
  const stops = [];
  const dropped = [];

  sources.forEach((source, index) => {
    const effort = walkingEffortFor(source);
    const duration = visitDurationMinutes(source, setup);
    const openingHours = parseOpeningHours(source.openingHours);
    const travelLeg = previousStop ? estimateTravelLeg(previousStop, source, setup) : null;

    if (travelLeg) cursor += travelLeg.minutes;

    // Once the clock reaches lunchtime, take the break before the next stop.
    if (!lunch && cursor >= LUNCH_FROM) {
      lunch = {
        label: 'Lunch & rest',
        startMinutes: cursor,
        durationMinutes: LUNCH_MINUTES,
        afterStopId: previousStop?.id ?? null,
      };
      cursor += LUNCH_MINUTES;
    }

    let waitedMinutes = 0;
    let warning = null;
    if (constrained && effort === 'high' && cursor < NOON) {
      // Eat before the big walk, then start the high-effort site at noon.
      if (!lunch) {
        cursor = Math.max(cursor, 11 * 60);
        lunch = {
          label: 'Lunch & rest',
          startMinutes: cursor,
          durationMinutes: LUNCH_MINUTES,
          afterStopId: previousStop?.id ?? null,
        };
        cursor += LUNCH_MINUTES;
      }
      if (cursor < NOON) {
        waitedMinutes += NOON - cursor;
        cursor = NOON;
      }
      warning = 'Scheduled after noon for limited walking';
    }

    const window = findOpeningWindow(openingHours, cursor, duration);
    if (window) {
      cursor = window.start;
      waitedMinutes += window.waitedMinutes;
    } else if (strict) {
      dropped.push({
        ...placeSnapshot(source),
        reason: `No opening window long enough for a ${formatDuration(duration)} visit (${source.openingHours || 'hours unknown'})`,
      });
      return;
    }

    if (strict && cursor + duration > dayLimit) {
      dropped.push({
        ...placeSnapshot(source),
        reason: kidMode
          ? 'Would run past the early finish for kids'
          : 'Would run past the end of the day',
      });
      return;
    }

    const arrivalMinutes = cursor;
    const endMinutes = arrivalMinutes + duration;
    const isOutsideHours = !window;
    const warnings = [];
    if (warning) warnings.push(warning);
    if (isOutsideHours) warnings.push('Outside the stated opening hours');
    if (constrained && effort === 'high' && arrivalMinutes < NOON) {
      warnings.push('High walking effort before noon');
    }
    if (endMinutes > dayLimit) {
      warnings.push(kidMode ? 'Runs past the early finish' : 'Late finish');
    }

    const stop = {
      ...placeSnapshot(source),
      effort,
      startMinutes: arrivalMinutes,
      endMinutes,
      startTime: formatClock(arrivalMinutes),
      endTime: formatClock(endMinutes),
      durationMinutes: duration,
      waitedMinutes,
      inSiteWalkMinutes: inSiteWalkMinutes(effort, setup),
      entryFee: estimateEntryFee(source.entryFeeLabel ?? source.entryFee),
      entryFeeLabel: source.entryFeeLabel || source.entryFee || '',
      warnings,
      travelMinutesToNext: 0,
      travelMetersToNext: 0,
      travelModeToNext: null,
      travelCostToNext: 0,
      travelMinutesFromPrevious: travelLeg ? travelLeg.minutes : 0,
      travelModeFromPrevious: travelLeg ? travelLeg.mode : null,
    };

    stops.push(stop);
    previousStop = stop;
    cursor = endMinutes;

    if (!lunch && endMinutes >= LUNCH_FROM && index < sources.length - 1) {
      lunch = {
        label: 'Lunch & rest',
        startMinutes: endMinutes,
        durationMinutes: LUNCH_MINUTES,
        afterStopId: stop.id,
      };
      cursor += LUNCH_MINUTES;
    }
  });

  attachTravel(stops, setup);

  const totals = computeTotals(stops);
  const lastStop = stops[stops.length - 1];
  const lunchEnd = lunch ? lunch.startMinutes + lunch.durationMinutes : 0;
  const endMinutes = Math.max(
    lastStop ? lastStop.endMinutes : startMinutes,
    lunchEnd,
    startMinutes
  );

  return {
    day: {
      ...dayMeta,
      weekday,
      startTime: formatClock(stops.length ? stops[0].startMinutes : startMinutes),
      endTime: formatClock(endMinutes),
      startMinutes: stops.length ? stops[0].startMinutes : startMinutes,
      endMinutes,
      stops,
      break: lunch
        ? {
            label: lunch.label,
            startTime: formatClock(lunch.startMinutes),
            endTime: formatClock(lunch.startMinutes + lunch.durationMinutes),
            durationMinutes: lunch.durationMinutes,
            afterStopId: lunch.afterStopId,
          }
        : null,
      totals,
    },
    dropped,
  };
}

/* ── probability / availability across weekdays ───────────────────── */

function placeClosedPlaces(clusters, setup, perDay) {
  const dayCount = clusters.length;
  const dates = Array.from({ length: dayCount }, (_, index) => addDaysISO(setup.startDate, index));
  const unassigned = [];

  clusters.forEach((group, index) => {
    const weekday = weekdayFor(dates[index]);
    clusters[index] = group.filter((place) => {
      if (!isClosedOnWeekday(place, weekday)) return true;
      const target = clusters.findIndex((candidate, candidateIndex) => (
        candidateIndex !== index
        && candidate.length < perDay
        && !isClosedOnWeekday(place, weekdayFor(dates[candidateIndex]))
      ));
      if (target !== -1) {
        clusters[target].push(place);
        return false;
      }
      unassigned.push({
        id: place.id,
        title: place.title,
        reason: `Closed on ${weekdayFor(dates[index])}s`,
      });
      return false;
    });
  });

  return unassigned;
}

/* ── public API ───────────────────────────────────────────────────── */

function emptyItinerary(setup) {
  return {
    setup,
    days: [],
    unassigned: [],
    notes: ['Add places to your Day Plan to build an itinerary.'],
    generatedAt: new Date().toISOString(),
    totals: {
      days: 0,
      stops: 0,
      visitMinutes: 0,
      travelMinutes: 0,
      walkingMinutes: 0,
      distanceMeters: 0,
      entryFees: 0,
      travelCost: 0,
      cost: 0,
    },
  };
}

function aggregateTotals(days) {
  return days.reduce(
    (totals, day) => {
      totals.visitMinutes += day.totals.visitMinutes;
      totals.travelMinutes += day.totals.travelMinutes;
      totals.walkingMinutes += day.totals.walkingMinutes;
      totals.distanceMeters += day.totals.distanceMeters;
      totals.entryFees += day.totals.entryFees;
      totals.travelCost += day.totals.travelCost;
      totals.stops += day.totals.stopCount;
      return totals;
    },
    {
      days: days.length,
      stops: 0,
      visitMinutes: 0,
      travelMinutes: 0,
      walkingMinutes: 0,
      distanceMeters: 0,
      entryFees: 0,
      travelCost: 0,
      cost: 0,
    }
  );
}

/**
 * Build an itinerary from selected places.
 *
 * @param {Array} selectedPlaces monuments from data/monuments.js
 * @param {Object} tripSetup { days, pace, startTime, seniors, limitedWalking, kids, startDate }
 * @returns {Object} itinerary { setup, days, unassigned, notes, totals, generatedAt }
 */
export function planTrip(selectedPlaces = [], tripSetup = {}) {
  const setup = normalizeSetup(tripSetup);
  const seen = new Set();
  const places = (Array.isArray(selectedPlaces) ? selectedPlaces : []).filter((place) => {
    if (!place?.id || !place.coords || seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });

  if (!places.length) return emptyItinerary(setup);

  const perDay = paceStopLimit(setup);
  const requestedDays = clamp(setup.days, 1, MAX_DAYS);
  const dayCount = clamp(
    Math.max(requestedDays, Math.ceil(places.length / perDay)),
    1,
    MAX_DAYS
  );

  const clusters = groupByProximity(places, dayCount, perDay);
  const unassignedFromClosures = placeClosedPlaces(clusters, setup, perDay);

  const days = [];
  const unassignedStops = [];
  let carryOver = [];

  for (let index = 0; index < dayCount; index += 1) {
    const date = addDaysISO(setup.startDate, index);
    const dayMeta = {
      id: `day-${index + 1}`,
      index,
      label: `Day ${index + 1}`,
      date,
      weekday: weekdayFor(date),
    };

    // A stop dropped from an earlier day may already belong to this cluster;
    // never schedule the same monument twice.
    const carried = carryOver.filter((place) => (
      !clusters[index].some((own) => own.id === place.id)
    ));
    const candidates = orderDayForSchedule([...clusters[index], ...carried], setup);
    const bucket = candidates.slice(0, perDay);
    const overflow = candidates.slice(perDay).map((place) => ({
      ...placeSnapshot(place),
      reason: 'No room left in this day',
    }));

    const { day, dropped } = buildDay(dayMeta, bucket, setup, true);
    carryOver = [...overflow, ...dropped];

    // If this is the last day, anything carried over stays unassigned.
    if (index === dayCount - 1) {
      unassignedStops.push(...carryOver.map((place) => ({
        id: place.id,
        title: place.title,
        reason: place.reason || 'Did not fit the requested days',
      })));
      carryOver = [];
    }

    days.push(day);
  }

  const totals = aggregateTotals(days);
  totals.cost = totals.entryFees + totals.travelCost;

  const notes = [];
  if (dayCount > requestedDays) {
    notes.push(
      `${places.length} stop${places.length === 1 ? '' : 's'} need${places.length === 1 ? 's' : ''} ${dayCount} days at a ${PACE_LABELS[setup.pace].toLowerCase()} pace.`
    );
  }
  if (setup.seniors || setup.limitedWalking) {
    notes.push('Short days with high-effort sites after noon, for limited walking.');
  }
  if (setup.kids) {
    notes.push('Shorter visits and an early finish to suit children.');
  }

  return {
    setup,
    days,
    unassigned: [...unassignedFromClosures, ...unassignedStops],
    notes,
    generatedAt: new Date().toISOString(),
    totals,
  };
}

/**
 * Recompute times, travel and totals after a stop is reordered, moved or
 * removed. Order is preserved exactly as supplied; stops that no longer fit
 * opening hours are kept and flagged so the traveler's edit is never lost.
 */
export function recalculateItinerary(itinerary, tripSetup) {
  if (!itinerary?.days?.length) {
    return itinerary || emptyItinerary(normalizeSetup(tripSetup));
  }

  const setup = normalizeSetup(tripSetup || itinerary.setup);
  const days = itinerary.days.map((day, index) => {
    const date = day.date || addDaysISO(setup.startDate, index);
    const { day: rebuilt } = buildDay(
      {
        id: day.id || `day-${index + 1}`,
        index,
        label: day.label || `Day ${index + 1}`,
        date,
        weekday: weekdayFor(date),
      },
      day.stops || [],
      setup,
      false
    );
    return rebuilt;
  });

  const totals = aggregateTotals(days);
  totals.cost = totals.entryFees + totals.travelCost;

  return {
    ...itinerary,
    setup,
    days,
    unassigned: itinerary.unassigned || [],
    notes: itinerary.notes || [],
    totals,
  };
}

/** Convenience helpers used by the itinerary view. */
export function moveStopWithinDay(itinerary, dayIndex, stopIndex, direction) {
  const targetIndex = stopIndex + direction;
  const day = itinerary.days[dayIndex];
  if (!day || targetIndex < 0 || targetIndex >= day.stops.length) return itinerary;

  const days = itinerary.days.map((entry, index) => (
    index === dayIndex ? { ...entry, stops: [...entry.stops] } : entry
  ));
  const stops = days[dayIndex].stops;
  [stops[stopIndex], stops[targetIndex]] = [stops[targetIndex], stops[stopIndex]];
  return recalculateItinerary({ ...itinerary, days }, itinerary.setup);
}

export function moveStopToDay(itinerary, fromDayIndex, stopId, toDayIndex) {
  if (fromDayIndex === toDayIndex) return itinerary;
  const sourceDay = itinerary.days[fromDayIndex];
  const targetDay = itinerary.days[toDayIndex];
  if (!sourceDay || !targetDay) return itinerary;

  const stopIndex = sourceDay.stops.findIndex((stop) => stop.id === stopId);
  if (stopIndex === -1) return itinerary;

  const days = itinerary.days.map((entry, index) => ({
    ...entry,
    stops: [...(entry.stops || [])],
  }));
  const [moved] = days[fromDayIndex].stops.splice(stopIndex, 1);
  days[toDayIndex].stops.push(moved);
  return recalculateItinerary({ ...itinerary, days }, itinerary.setup);
}

export function removeStop(itinerary, dayIndex, stopId) {
  const days = itinerary.days.map((entry, index) => (
    index === dayIndex
      ? { ...entry, stops: entry.stops.filter((stop) => stop.id !== stopId) }
      : entry
  ));
  return recalculateItinerary({ ...itinerary, days }, itinerary.setup);
}
