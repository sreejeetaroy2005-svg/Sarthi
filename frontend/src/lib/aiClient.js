/** Sarthi's browser client for server-side Gemini helpers. No API keys live here. */
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

async function postJson(path, payload, { signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Sarthi AI request failed (${response.status})`);
  return result;
}

function validateVisionResult(value) {
  if (!value || typeof value.match !== 'boolean' || typeof value.confidence !== 'number' ||
      value.confidence < 0 || value.confidence > 1 || typeof value.reason !== 'string' ||
      typeof value.placeName !== 'string' || typeof value.landmark !== 'string' ||
      typeof value.fallback !== 'boolean' || !['gemini', 'fallback'].includes(value.source) ||
      value.fallback !== (value.source === 'fallback') ||
      (value.match && (typeof value.placeId !== 'string' || !value.placeName || !value.landmark)) ||
      (!value.match && value.placeId !== null)) throw new Error('Sarthi returned an invalid photo check-in result.');
}

function validatePlanResult(value) {
  if (!value || !Array.isArray(value.days) || typeof value.message !== 'string' || typeof value.fallback !== 'boolean' ||
      !['gemini', 'fallback'].includes(value.source) || value.fallback !== (value.source === 'fallback') ||
      value.days.some((day) => !Number.isInteger(day.dayIndex) || !Array.isArray(day.placeIds) || typeof day.note !== 'string')) {
    throw new Error('Sarthi returned an invalid itinerary response.');
  }
}

function validateAskResult(value) {
  if (!value || typeof value.answer !== 'string' || typeof value.grounded !== 'boolean' ||
      !Array.isArray(value.sourceLabels) || typeof value.fallback !== 'boolean' ||
      !['gemini', 'fallback'].includes(value.source) || value.fallback !== (value.source === 'fallback') ||
      (value.grounded && (!value.answer.trim() || !value.sourceLabels.length)) ||
      (!value.grounded && value.sourceLabels.length)) {
    throw new Error('Sarthi returned an invalid guide answer.');
  }
}

function validateStoryResult(value) {
  if (!value || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 100 ||
      typeof value.summary !== 'string' || !value.summary.trim() || value.summary.length > 900 ||
      typeof value.fallback !== 'boolean' || !['gemini', 'fallback'].includes(value.source) ||
      value.fallback !== (value.source === 'fallback')) {
    throw new Error('Sarthi returned an invalid Trip Story.');
  }
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const comma = dataUrl.indexOf(',');
      if (comma < 0) return reject(new Error('Could not read the selected photo.'));
      resolve(dataUrl.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.readAsDataURL(file);
  });
}

export async function identifyPlaceFromPhoto(file, candidatePlaceIds, { signal } = {}) {
  if (!(file instanceof Blob) || !file.size || file.size > MAX_PHOTO_BYTES) {
    throw new Error('Choose a photo smaller than 6 MB.');
  }
  const mimeType = file.type.toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Choose a JPEG, PNG, or WebP photo.');
  }
  const result = await postJson('/ai/vision', {
    imageBase64: await readAsBase64(file),
    mimeType,
    candidatePlaceIds,
  }, { signal });
  validateVisionResult(result);
  return result;
}

export async function requestTripPlan(trip, remainingPlaceIds, language = 'en', { signal } = {}) {
  const result = await postJson('/ai/plan', { trip, remainingPlaceIds, language }, { signal });
  validatePlanResult(result);
  return result;
}

export async function askGuideQuestion(placeId, question, language = 'en', { signal } = {}) {
  const result = await postJson('/ai/ask', { placeId, question, language }, { signal });
  validateAskResult(result);
  return result;
}

export async function writeTripStory({ places, photos = [], timeWalkedMinutes = 0, language = 'en' }, { signal } = {}) {
  const result = await postJson('/ai/story', { places, photos, timeWalkedMinutes, language }, { signal });
  validateStoryResult(result);
  return result;
}
