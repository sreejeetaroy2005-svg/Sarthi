import { paceStopLimit, walkingEffortFor } from './planner';

const INTEREST_CATEGORY = {
  heritage: 'Heritage',
  spiritual: 'Spiritual',
  culture: 'Culture',
  architecture: 'Heritage',
  photography: 'Heritage',
};

/**
 * Choose the places a group would most likely want in auto mode:
 * interest match first, then rating, with high-effort sites demoted for
 * seniors, limited walking and young children. The number of picks is capped
 * by what the trip can realistically fit.
 */
export function preselectPlaceIds(places = [], setup = {}) {
  const group = setup.group || {};
  const interests = (group.interests || []).map((interest) => String(interest).toLowerCase());
  const needs = group.needs || [];

  const wantsCategories = new Set(
    interests
      .filter((interest) => interest !== 'architecture' && interest !== 'photography')
      .map((interest) => INTEREST_CATEGORY[interest])
      .filter(Boolean)
  );

  const walkSensitive = Boolean(
    group.counts?.seniors > 0 ||
    group.tripType === 'senior' ||
    needs.includes('limited_walking') ||
    needs.includes('step_free')
  );
  const withChildren = (group.counts?.children || 0) > 0;

  const capacity = Math.min(
    places.length,
    Math.max(1, (Number(setup.days) || 1) * paceStopLimit(setup))
  );

  const scored = places.map((place, index) => {
    let score = Number(place.rating) || 4;
    if (wantsCategories.has(place.category)) score += 4;
    if (interests.includes('photography') && place.unescoStatus) score += 1;
    if (interests.includes('architecture') && place.builtYear) score += 0.8;

    const effort = walkingEffortFor(place);
    if (walkSensitive && effort === 'high') score -= 3;
    if (walkSensitive && effort === 'low') score += 1.5;
    if (withChildren && effort === 'high') score -= 0.8;

    return { place, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, capacity)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.place.id);
}
