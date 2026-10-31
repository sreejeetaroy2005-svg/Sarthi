/**
 * JSON schemas and runtime validators shared by Gemini requests and API output.
 * Runtime checks also enforce constraints (IDs and labels must exist in the
 * server-owned Sarthi data) that JSON Schema alone cannot express.
 */

const string = { type: 'STRING' };
const bool = { type: 'BOOLEAN' };
const hasOnlyKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => Object.hasOwn(value, key));

export const visionSchema = {
  type: 'OBJECT',
  additionalProperties: false,
  properties: {
    match: bool,
    placeId: { type: 'STRING', nullable: true },
    placeName: string,
    landmark: string,
    confidence: { type: 'NUMBER' },
    reason: string,
  },
  required: ['match', 'placeId', 'placeName', 'landmark', 'confidence', 'reason'],
  propertyOrdering: ['match', 'placeId', 'placeName', 'landmark', 'confidence', 'reason'],
};

export const planSchema = {
  type: 'OBJECT',
  additionalProperties: false,
  properties: {
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        additionalProperties: false,
        properties: {
          dayIndex: { type: 'INTEGER' },
          placeIds: { type: 'ARRAY', items: string },
          note: string,
        },
        required: ['dayIndex', 'placeIds', 'note'],
        propertyOrdering: ['dayIndex', 'placeIds', 'note'],
      },
    },
    message: string,
  },
  required: ['days', 'message'],
  propertyOrdering: ['days', 'message'],
};

export const askSchema = {
  type: 'OBJECT',
  additionalProperties: false,
  properties: {
    answer: string,
    grounded: bool,
    sourceLabels: { type: 'ARRAY', items: string },
  },
  required: ['answer', 'grounded', 'sourceLabels'],
  propertyOrdering: ['answer', 'grounded', 'sourceLabels'],
};

export const storySchema = {
  type: 'OBJECT',
  additionalProperties: false,
  properties: { title: { type: 'STRING' }, summary: { type: 'STRING' } },
  required: ['title', 'summary'],
  propertyOrdering: ['title', 'summary'],
};

export function validateStory(value) {
  return Boolean(hasOnlyKeys(value, ['title', 'summary']) &&
    typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 100 &&
    typeof value.summary === 'string' && value.summary.trim().length > 0 && value.summary.length <= 900);
}

export function validateVision(value, candidates) {
  if (!hasOnlyKeys(value, ['match', 'placeId', 'placeName', 'landmark', 'confidence', 'reason']) ||
      typeof value.match !== 'boolean' || typeof value.confidence !== 'number' ||
      value.confidence < 0 || value.confidence > 1 || typeof value.reason !== 'string' ||
      typeof value.placeName !== 'string' || typeof value.landmark !== 'string') return false;

  if (!value.match) return value.placeId === null && !value.placeName && !value.landmark;
  const place = candidates.find((candidate) => candidate.id === value.placeId);
  return Boolean(place && place.title === value.placeName &&
    place.landmarks.includes(value.landmark) && value.confidence >= 0.35);
}

export function validatePlan(value, allowedIds, dayCount) {
  if (!hasOnlyKeys(value, ['days', 'message']) || !Array.isArray(value.days) ||
      value.days.length !== dayCount || typeof value.message !== 'string') return false;
  const seen = new Set();
  const dayIndexes = new Set();
  for (const day of value.days) {
    if (!hasOnlyKeys(day, ['dayIndex', 'placeIds', 'note']) ||
        !Number.isInteger(day.dayIndex) || day.dayIndex < 0 || day.dayIndex >= dayCount || dayIndexes.has(day.dayIndex) ||
        !Array.isArray(day.placeIds) || typeof day.note !== 'string') return false;
    dayIndexes.add(day.dayIndex);
    for (const id of day.placeIds) {
      if (typeof id !== 'string' || !allowedIds.has(id) || seen.has(id)) return false;
      seen.add(id);
    }
  }
  return seen.size === allowedIds.size;
}

export function validateAsk(value, allowedLabels) {
  return Boolean(hasOnlyKeys(value, ['answer', 'grounded', 'sourceLabels']) && typeof value.answer === 'string' && value.answer.length <= 1200 &&
    typeof value.grounded === 'boolean' && Array.isArray(value.sourceLabels) &&
    value.sourceLabels.every((label) => typeof label === 'string' && allowedLabels.has(label)) &&
    (value.grounded ? value.answer.trim().length > 0 && value.sourceLabels.length > 0 : value.sourceLabels.length === 0));
}
