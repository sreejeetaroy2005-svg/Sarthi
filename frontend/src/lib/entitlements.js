/** Single entitlement boundary. Replace these local grants with a verified backend payment grant later. */
const STORAGE_KEY = 'sarthi_entitlements';

export function readEntitlements() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      placeIds: Array.isArray(parsed.placeIds) ? [...new Set(parsed.placeIds.filter((id) => typeof id === 'string'))] : [],
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
      peopleLimit: Number.isInteger(parsed.peopleLimit) ? parsed.peopleLimit : 0,
    };
  } catch {
    return { placeIds: [], offers: [], peopleLimit: 0 };
  }
}

export function saveEntitlements(entitlements) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlements));
  } catch {
    // The current app can still use an in-memory grant if storage is unavailable.
  }
}

export function grantDemoEntitlement(current, { offerId, placeIds = [], peopleLimit = 1 }) {
  const next = {
    placeIds: [...new Set([...(current?.placeIds || []), ...placeIds])],
    offers: [...new Set([...(current?.offers || []), offerId])],
    peopleLimit: Math.max(current?.peopleLimit || 0, peopleLimit),
    demo: true,
  };
  saveEntitlements(next);
  return next;
}

export function hasGuidePass(entitlements, placeId) {
  return Boolean(placeId && entitlements?.placeIds?.includes(placeId));
}

export function canAccessGuideFeature(entitlements, placeId, feature = 'guidedWalk') {
  const premiumFeatures = new Set(['arrivalBriefing', 'photoCheckIn', 'guidedWalk', 'voiceQuestions', 'tripStory']);
  return premiumFeatures.has(feature) && hasGuidePass(entitlements, placeId);
}

