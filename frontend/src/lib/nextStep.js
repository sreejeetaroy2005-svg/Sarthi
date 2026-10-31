import { getDistanceInMeters } from '../utils/distance';

const SPEED_KMH = Object.freeze({ walk: 4.5, auto: 16, cab: 20 });
const MEAL_WINDOWS = Object.freeze([
  { id: 'breakfast', label: 'Breakfast', from: 8 * 60, to: 10 * 60 },
  { id: 'lunch', label: 'Lunch', from: 12 * 60, to: 14 * 60 },
  { id: 'dinner', label: 'Dinner', from: 19 * 60, to: 21 * 60 },
]);

const pad = (number) => String(number).padStart(2, '0');

export function minutesOfDay(value) {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  const text = String(value || '').trim();
  const twelveHour = /^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/i.exec(text);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toLowerCase() === 'p') hour += 12;
    return hour * 60 + Number(twelveHour[2] || 0);
  }
  const twentyFourHour = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (twentyFourHour) return Math.min(23, Number(twentyFourHour[1])) * 60 + Math.min(59, Number(twentyFourHour[2]));
  return 0;
}

export function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function parseHours(place) {
  const raw = String(place?.openingHours || '');
  const windows = [];
  const pattern = /(\d{1,2}(?::\d{2})?)\s*([AP]M)\s*[–—-]\s*(\d{1,2}(?::\d{2})?)\s*([AP]M)/gi;
  let match;
  while ((match = pattern.exec(raw))) {
    const start = minutesOfDay(`${match[1]} ${match[2]}`);
    const close = minutesOfDay(`${match[3]} ${match[4]}`);
    if (close > start) windows.push({ open: start, close });
  }
  const closedMatch = /closed\s+([^)]*)/i.exec(raw);
  const closedDays = closedMatch ? closedMatch[1].toLowerCase().split(/[,\s]+/).filter(Boolean) : [];
  return { windows, closedDays };
}

function durationMinutes(place) {
  const numeric = Number(place?.visitDuration ?? place?.durationMinutes);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const matches = String(place?.avgTimeSpent || '').match(/\d+(?:\.\d+)?/g) || [];
  if (!matches.length) return 60;
  return Math.round(matches.map(Number).reduce((sum, number) => sum + number, 0) / matches.length * 60);
}

function distanceFromLabel(label) {
  const match = /(\d+(?:\.\d+)?)\s*(km|m)\b/i.exec(String(label || ''));
  if (!match) return null;
  const distance = Number(match[1]);
  return match[2].toLowerCase() === 'km' ? distance : distance / 1000;
}

function hasVegetarianNeed(groupNeeds = {}) {
  const needs = Array.isArray(groupNeeds.needs) ? groupNeeds.needs : [];
  return Boolean(groupNeeds.vegetarian || needs.includes('vegetarian'));
}

export function getMealWindow(now) {
  const minute = minutesOfDay(now);
  const active = MEAL_WINDOWS.find((window) => minute >= window.from && minute < window.to);
  if (active) return { ...active, status: 'now' };
  const upcoming = MEAL_WINDOWS.find((window) => window.from > minute);
  return upcoming ? { ...upcoming, status: 'upcoming', minutesUntil: upcoming.from - minute } : null;
}

export function getNearbyDining(place, groupNeeds = {}, maxDistanceKm = 5, origin = place?.coords) {
  const vegetarian = hasVegetarianNeed(groupNeeds);
  return (place?.nearbyDining || [])
    .map((item) => {
      const from = origin?.coords || origin;
      const to = item.coords;
      const meters = Number.isFinite(from?.lat) && Number.isFinite(from?.lng) && Number.isFinite(to?.lat) && Number.isFinite(to?.lng)
        ? getDistanceInMeters(from.lat, from.lng, to.lat, to.lng)
        : null;
      return { ...item, distanceKm: meters === null ? distanceFromLabel(item.distance) : meters / 1000 };
    })
    .filter((item) => item.distanceKm !== null && item.distanceKm <= maxDistanceKm)
    .filter((item) => !vegetarian || item.vegetarian === true || /vegetarian|\bveg\b|pure veg/i.test(`${item.name} ${item.cuisine || ''}`))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function estimateTravelMinutes(from, to, mode, travelTimes) {
  const key = `${from?.id || 'origin'}:${to?.id}`;
  const configured = Number(travelTimes?.[key] ?? travelTimes?.[to?.id]);
  if (Number.isFinite(configured) && configured >= 0) return configured;
  const fromCoords = from?.coords || from;
  const toCoords = to?.coords;
  if (!fromCoords || !toCoords || !Number.isFinite(fromCoords.lat) || !Number.isFinite(fromCoords.lng)) return 0;
  const meters = getDistanceInMeters(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
  const speed = SPEED_KMH[mode] || SPEED_KMH.auto;
  const routeFactor = mode === 'walk' ? 1.12 : 1.3;
  return Math.max(meters < 120 ? 1 : 2, Math.ceil((meters / 1000 * routeFactor) / speed * 60));
}

function dayWindow(place, arrivalMinute, visitMinutes, weekday) {
  const { windows, closedDays } = parseHours(place);
  const weekdayShort = String(weekday || '').slice(0, 3).toLowerCase();
  if (closedDays.some((day) => weekdayShort.startsWith(day.slice(0, 3)))) {
    return { feasible: false, start: arrivalMinute, close: null, reason: 'Closed today' };
  }
  if (!windows.length) return { feasible: true, start: arrivalMinute, close: null, reason: 'Opening hours unavailable' };
  for (const window of windows) {
    const start = Math.max(arrivalMinute, window.open);
    if (start + visitMinutes <= window.close) return { feasible: true, start, close: window.close, reason: '' };
  }
  return { feasible: false, start: arrivalMinute, close: windows.at(-1).close, reason: 'Not enough time before closing' };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function reorderRemainingStops({ now, location, currentPlace, remainingStops = [], travelMode = 'auto', travelTimes = {} }) {
  const baseDate = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(baseDate.getTime())) return [];
  let cursorDate = baseDate;
  let cursorPlace = (location?.coords || (Number.isFinite(location?.lat) && Number.isFinite(location?.lng)))
    ? location
    : currentPlace || location || null;
  let pending = [...remainingStops];
  const ordered = [];
  const weekday = baseDate.toLocaleDateString('en-US', { weekday: 'long' });

  while (pending.length) {
    const candidates = pending.map((place) => {
      const travelMinutes = estimateTravelMinutes(cursorPlace, place, travelMode, travelTimes);
      const arrivalDate = addMinutes(cursorDate, travelMinutes);
      const window = dayWindow(place, minutesOfDay(arrivalDate), durationMinutes(place), weekday);
      const openDelay = Math.max(0, window.start - minutesOfDay(arrivalDate));
      return {
        place,
        travelMinutes,
        arrivalDate: addMinutes(arrivalDate, openDelay),
        visitMinutes: durationMinutes(place),
        closingAt: window.close,
        feasible: window.feasible,
        reason: window.reason,
        score: (window.feasible ? 0 : 1_000_000) + travelMinutes + openDelay,
      };
    }).sort((a, b) => a.score - b.score || a.place.title.localeCompare(b.place.title));
    const next = candidates[0];
    ordered.push({
      ...next,
      eta: formatTime(next.arrivalDate),
      endsAt: formatTime(addMinutes(next.arrivalDate, next.visitMinutes)),
      travelLabel: `${next.travelMinutes} min`,
      closingTime: next.closingAt === null ? null : formatTime(addMinutes(baseDate, next.closingAt - minutesOfDay(baseDate))),
    });
    pending = pending.filter((place) => place.id !== next.place.id);
    cursorDate = addMinutes(next.arrivalDate, next.visitMinutes);
    cursorPlace = next.place;
  }
  return ordered;
}

export function calculateNextStep({
  now,
  location,
  currentPlace,
  completedStops = [],
  remainingStops = [],
  groupNeeds = {},
  timeWalkedMinutes = 0,
  travelMode = 'auto',
  travelTimes = {},
}) {
  const currentTime = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(currentTime.getTime())) throw new TypeError('calculateNextStep requires a valid now value.');
  const orderedRemaining = reorderRemainingStops({ now: currentTime, location, currentPlace, remainingStops, travelMode, travelTimes });
  const firstFeasible = orderedRemaining.find((item) => item.feasible);
  const nextStop = firstFeasible || orderedRemaining[0] || null;
  const mealWindow = getMealWindow(currentTime);
  const seniors = Boolean(groupNeeds.seniors || groupNeeds.tripType === 'senior');
  const kids = Boolean(groupNeeds.kids || groupNeeds.counts?.children > 0);
  const fatigueThreshold = seniors ? 35 : kids ? 45 : 75;
  const restMinutes = timeWalkedMinutes >= fatigueThreshold ? 30 : 15;
  const fatigue = timeWalkedMinutes >= fatigueThreshold * 2 ? 'high' : timeWalkedMinutes >= fatigueThreshold ? 'moderate' : 'low';
  const dining = getNearbyDining(currentPlace, groupNeeds, 5, location);
  const mealRecommended = Boolean(mealWindow && (mealWindow.status === 'now' || mealWindow.minutesUntil <= 45));
  const late = currentTime.getHours() >= (kids ? 17 : 19);

  return {
    now: currentTime,
    currentTimeLabel: formatTime(currentTime),
    location,
    completedStops,
    remainingStops: orderedRemaining.map((item) => item.place),
    orderedRemaining,
    nextStop,
    eta: nextStop?.eta || null,
    eatNearby: {
      mealWindow,
      recommended: mealRecommended,
      places: dining,
      vegetarianOnly: hasVegetarianNeed(groupNeeds),
    },
    fatigue: {
      level: fatigue,
      timeWalkedMinutes: Math.max(0, Number(timeWalkedMinutes) || 0),
      restMinutes,
      recommended: fatigue !== 'low',
    },
    endDayRecommended: late || fatigue === 'high' || remainingStops.length === 0 || (orderedRemaining.length > 0 && !orderedRemaining.some((item) => item.feasible)),
  };
}

export function calculateReturnTrip({ now, location, hotelOrigin, travelMode = 'auto', travelTimes = {} }) {
  const currentTime = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(currentTime.getTime())) throw new TypeError('calculateReturnTrip requires a valid now value.');
  if (!Number.isFinite(hotelOrigin?.lat) || !Number.isFinite(hotelOrigin?.lng) ||
      !Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) {
    return { available: false, eta: null, minutes: null, distanceKm: null };
  }
  const key = `return:${hotelOrigin.id || hotelOrigin.name || 'hotel'}`;
  const configured = Number(travelTimes?.[key]);
  const meters = getDistanceInMeters(location.lat, location.lng, hotelOrigin.lat, hotelOrigin.lng);
  const speed = SPEED_KMH[travelMode] || SPEED_KMH.auto;
  const minutes = Number.isFinite(configured) && configured >= 0
    ? configured
    : Math.max(1, Math.ceil((meters / 1000 * (travelMode === 'walk' ? 1.12 : 1.3)) / speed * 60));
  return {
    available: true,
    eta: formatTime(addMinutes(currentTime, minutes)),
    minutes,
    distanceKm: Number((meters / 1000).toFixed(1)),
    destination: hotelOrigin.name || 'Hotel',
    modeLabel: travelMode === 'walk' ? 'walking' : travelMode === 'cab' ? 'cab' : 'auto-rickshaw',
  };
}

