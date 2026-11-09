import { MONUMENTS } from '../data/monuments';

/* ── storage version & migration ─────────────────────────────────────── */
const STORAGE_VERSION = 1;
const STORAGE_KEY = 'sarthi_profile_v' + STORAGE_VERSION;

/** Migrate old localStorage keys to the current version. */
function migrate(old) {
  if (!old) return null;
  // Version-1 migration: old key had no .v1 suffix
  if (old.__version < STORAGE_VERSION) {
    const merged = {
      ...old,
      __version: STORAGE_VERSION,
    };
    // ensure pointsLedger exists
    if (!merged.pointsLedger) merged.pointsLedger = [];
    // ensure badges exists
    if (!merged.badges) merged.badges = [];
    // ensure entitlements exists
    if (!merged.entitlements) merged.entitlements = { placeIds: [], offers: [], peopleLimit: 0, demo: false };
    return merged;
  }
  return old;
}

/* ── Profile ─────────────────────────────────────────────────────────── */

export function readProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    if (!migrated || !migrated.__version) return createDefaultProfile();
    // Derive defaults
    const profile = {
      name: migrated.name || '',
      avatar: migrated.avatar || initialsAvatar(migrated.name),
      homeCity: migrated.homeCity || '',
      joinedAt: migrated.joinedAt || new Date().toISOString(),
      language: migrated.language || 'en',
      level: migrated.level || 'wanderer',
      explorationScore: migrated.explorationScore || 0,
      pointsBalance: derivedPointsBalance(migrated.pointsLedger || []),
      badges: migrated.badges || [],
      entitlements: migrated.entitlements || { placeIds: [], offers: [], peopleLimit: 0, demo: false },
      trips: migrated.trips || [],
      redemptions: migrated.redemptions || [],
      demoClockTime: migrated.demoClockTime,
    };
    return profile;
  } catch (e) {
    console.warn('[profileStore] failed to read profile, resetting', e);
    return createDefaultProfile();
  }
}

export function createDefaultProfile() {
  return {
    name: '',
    avatar: '',
    homeCity: '',
    joinedAt: new Date().toISOString(),
    language: 'en',
    level: 'wanderer',
    explorationScore: 0,
    pointsBalance: 0,
    badges: [],
    entitlements: { placeIds: [], offers: [], peopleLimit: 0, demo: false },
    trips: [],
    redemptions: [],
    demoClockTime: '',
  };
}

export function initialsAvatar(name) {
  if (!name) return '🧘';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function writeProfile(profile) {
  try {
    const toStore = {
      ...profile,
      __version: STORAGE_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn('[profileStore] failed to write profile', e);
  }
}

/* ── Trips ───────────────────────────────────────────────────────────── */

function tripId() {
  return 'trip-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

export function readTrips() {
  const profile = readProfile();
  return profile.trips || [];
}

export function addTrip(trip) {
  const profile = readProfile();
  const normalized = {
    ...trip,
    id: trip.id || tripId(),
    status: trip.status || 'draft',
    createdAt: trip.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Only one active trip at a time
  const activeIdx = profile.trips.findIndex(t => t.status === 'active');
  if (normalized.status === 'active' && activeIdx >= 0) {
    profile.trips[activeIdx] = { ...profile.trips[activeIdx], status: 'draft' };
  }
  profile.trips.push(normalized);
  writeProfile(profile);
  return normalized.id;
}

export function updateTrip(id, patch) {
  const profile = readProfile();
  const idx = profile.trips.findIndex(t => t.id === id);
  if (idx < 0) return null;
  profile.trips[idx] = { ...profile.trips[idx], ...patch, updatedAt: new Date().toISOString() };
  writeProfile(profile);
  return profile.trips[idx];
}

export function removeTrip(id, confirm = true) {
  if (confirm) {
    if (!window.confirm('Delete this draft trip? This cannot be undone.')) return;
  }
  const profile = readProfile();
  const idx = profile.trips.findIndex(t => t.id === id);
  if (idx < 0) return;
  // If it's the only active trip, just mark it draft
  if (profile.trips[idx].status === 'active') {
    profile.trips[idx].status = 'draft';
  } else {
    profile.trips.splice(idx, 1);
  }
  writeProfile(profile);
}

/* ── Points ledger ───────────────────────────────────────────────────── */

export function addPointsLedgerEntry(entry) {
  const profile = readProfile();
  entry.id = entry.id || 'pt-' + Date.now();
  // Daily cap: only count points per rule once per day
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayEntries = (profile.pointsLedger || [])
    .filter(e => {
      const eDate = e.date ? new Date(e.date).toISOString().split('T')[0] : '';
      return eDate === todayKey;
    });
  const dailyCap = 300;
  const reasonCounts = {};
  for (const e of todayEntries) {
    reasonCounts[e.reason] = (reasonCounts[e.reason] || 0) + 1;
  }

  const reasonLimits = {
    'trip_created': 1,
    'trip_completed': 1,
    'checkin_photo': 1,
    'manual_checkin': 1,
    'guided_walk_completed': 1,
    'story_shared': 1,
    'new_monument_first_time': 1,
    'language_used': 1,
  };

  if (reasonCounts[entry.reason] >= (reasonLimits[entry.reason] || 1)) {
    console.warn('[profileStore] daily aborted for reason:', entry.reason);
    return profile.pointsBalance; // return current balance, did not add
  }

  const newEntry = {
    ...entry,
    id: entry.id,
    date: entry.date || now.toISOString(),
  };
  profile.pointsLedger = [...(profile.pointsLedger || []), newEntry];
  writeProfile(profile);
  return derivedPointsBalance(profile.pointsLedger);
}

export function derivePointsBalance(ledger) {
  // Derive balance from the ledger — never store only the balance
  let balance = 0;
  const seen = new Set();
  for (const entry of (ledger || [])) {
    const key = `${entry.reason}-${entry.tripId || ''}-${entry.date}`;
    if (seen.has(key)) continue; // already counted
    seen.add(key);
    balance += entry.points;
  }
  return balance;
}

export function derivedPointsBalance(ledger) {
  return derivePointsBalance(ledger);
}

/* ── Redemptions ─────────────────────────────────────────────────────── */

export function addRedemption({ rewardId, cost }) {
  const profile = readProfile();
  // Check balance
  const balance = derivedPointsBalance(profile.pointsLedger);
  if (balance < cost) {
    console.warn('[profileStore] insufficient points for redemption');
    return profile.pointsBalance;
  }
  const newRedemption = {
    id: 'red-' + Date.now(),
    date: new Date().toISOString(),
    rewardId,
    cost,
  };
  profile.redemptions = [...(profile.redemptions || []), newRedemption];
  // Deduct points: remove from ledger or reduce entries
  // Simple approach: just record the redemption; balance is always derived
  writeProfile(profile);
  return profile.pointsBalance;
}

/* ── Badges ──────────────────────────────────────────────────────────── */

const BADGE_RULES = {
  firstTrip: {
    title: t => t(`badge.firstTrip`),
    desc: t => t(`badge.firstTripDesc`),
    check: profile => profile.trips.length >= 1,
  },
  mugalExplorer: {
    title: t => t(`badge.mugalExplorer`),
    desc: t => t(`badge.mugalExplorerDesc`),
    check: profile => {
      const mughal = ['humayun-tomb', 'red-fort', 'qutub-minar'];
      return profile.trips.some(t => t.placesVisited && t.placesVisited.some(id => mughal.includes(id)));
    },
  },
  earlyBird: {
    title: t => t(`badge.earlyBird`),
    desc: t => t(`badge.earlyBirdDesc`),
    check: profile => {
      return profile.trips.some(t => t.startDate && new Date(t.startDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    },
  },
  polyglot: {
    title: t => t(`badge.polyglot`),
    desc: t => t(`badge.polyglotDesc`),
    check: profile => {
      const languages = new Set(
        profile.trips.flatMap(t => t.languagesUsed || []).map(l => String(l))
      );
      return languages.size >= 2;
    },
  },
  photographer: {
    title: t => t(`badge.photographer`),
    desc: t => t(`badge.photographerDesc`),
    check: profile => {
      const count = (profile.pointsLedger || [])
        .filter(e => e.reason && e.reason.startsWith('checkin_photo'))
        .length;
      return count >= 10;
    },
  },
};

/** Re-evaluate all badges from the current profile. */
export function recomputeBadges() {
  const profile = readProfile();
  const earned = [];
  for (const key of Object.keys(BADGE_RULES)) {
    const rule = BADGE_RULES[key];
    if (rule.check(profile)) {
      earned.push({
        id: key,
        title: rule.title,
        desc: rule.desc,
        earnedAt: new Date().toISOString(),
      });
    }
  }
  // Merge with existing badges, dedup by id
  const existingIds = new Set((profile.badges || []).map(b => b.id));
  const merged = [...(profile.badges || []), ...earned].filter(b => !existingIds.has(b.id));
  // Return updated profile with badges
  const updated = { ...profile, badges: merged };
  writeProfile(updated);
  return updated.badges;
}

/* ── Level / XP ──────────────────────────────────────────────────────── */

const LEVEL_THRESHOLDS = [
  { level: 'wanderer', minScore: 0 },
  { level: 'explorer', minScore: 200 },
  { level: 'heritageKeeper', minScore: 500 },
  { level: 'sarthiMaster', minScore: 1000 },
];

export function computeLevel(score) {
  const level = LEVEL_THRESHOLDS.find(l => score >= l.minScore);
  return level ? level.level : 'wanderer';
}

export function nextLevelInfo(score) {
  const current = LEVEL_THRESHOLDS.find(l => score >= l.minScore);
  const next = LEVEL_THRESHOLDS.find(l => score < l.minScore);
  if (!next) return { level: current.level, progress: 100, remaining: 0 };
  const progress = Math.min(100, ((score - (current ? current.minScore : 0)) / (next.minScore - (current ? current.minScore : 1))) * 100);
  return {
    level: current ? current.level : 'wanderer',
    progress: Math.max(0, Math.min(100, progress)),
    remaining: Math.max(0, next.minScore - score),
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

export function awardPoints(reason, tripId) {
  // Public API: award points from flow events, enforces rules
  return addPointsLedgerEntry({ reason, tripId });
}

export function getProfile() {
  return readProfile();
}