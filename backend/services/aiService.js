import { MONUMENTS } from '../../frontend/src/data/monuments.js';
import { localizePlace } from '../../frontend/src/data/translations/placeContent.js';
import { config } from '../config.js';
import {
  askSchema, planSchema, storySchema, validateAsk, validatePlan, validateStory, validateVision, visionSchema,
} from './aiSchemas.js';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const IMAGE_MAX_BYTES = 6 * 1024 * 1024;
const LANGUAGES = new Set(['en', 'hi', 'ta', 'bn', 'en-IN', 'hi-IN', 'ta-IN', 'bn-IN']);
const PLACE_BY_ID = new Map(MONUMENTS.map((place) => [place.id, place]));

function text(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeLanguage(value) {
  return LANGUAGES.has(value) ? value : 'en';
}

function getLandmarks(place) {
  const names = [
    ...(Array.isArray(place.walkingRoute) ? place.walkingRoute.map((stop) => stop.name || stop.title) : []),
    ...(Array.isArray(place.audioChapters) ? place.audioChapters.map((chapter) => chapter.title) : []),
  ].filter((name) => typeof name === 'string' && name.trim());
  return [...new Set([place.title, ...names])];
}

function getPlaceFacts(place, language = 'en') {
  place = localizePlace(place, language);
  const story = place.storyContent || {};
  const facts = [];
  const add = (label, value) => {
    if (typeof value === 'string' && value.trim()) facts.push({ label, text: value.trim() });
  };
  add('overview', place.overview);
  add('story introduction', story.intro);
  (story.bodyParagraphs || []).forEach((paragraph, index) => add(`story ${index + 1}`, paragraph));
  (story.architecturalSecrets || []).forEach((fact) => add(fact.title, fact.desc));
  (place.keyHighlights || []).forEach((highlight, index) => add(`highlight ${index + 1}`, highlight));
  (place.audioChapters || []).forEach((chapter) => add(chapter.title, chapter.transcript));
  add('visitor guidelines', place.visitorGuidelines);
  add('opening hours', place.openingHours);
  add('entry fee', place.entryFee);
  return facts;
}

function geminiSchema(schema) {
  return {
    generationConfig: {
      responseMimeType: 'application/json',
      responseFormat: { text: { mimeType: 'application/json', schema } },
      maxOutputTokens: 1200,
    },
  };
}

async function generateJson({ system, parts, schema }) {
  if (!config.isGeminiKeyConfigured()) throw new Error('GEMINI_API_KEY is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_ROOT}/${encodeURIComponent(config.geminiModel)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        ...geminiSchema(schema),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      throw new Error(`Gemini returned ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const payload = await response.json();
    const output = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!output) throw new Error('Gemini returned no JSON content');
    return JSON.parse(output);
  } finally {
    clearTimeout(timeout);
  }
}

function visionFallback(language = 'en') {
  const reasons = {
    en: 'I could not confirm the place from this photo. Try another angle or choose “I’m here” to check in manually.',
    hi: 'इस तस्वीर से जगह की पुष्टि नहीं हो सकी। दूसरा कोण आज़माएँ या हाथ से चेक-इन करने के लिए “मैं यहाँ हूँ” चुनें।',
    ta: 'இந்தப் புகைப்படத்தில் இடத்தை உறுதிப்படுத்த முடியவில்லை. வேறு கோணத்தில் முயற்சிக்கவும் அல்லது கைமுறையாகப் பதிவு செய்ய “நான் இங்கே இருக்கிறேன்” என்பதைத் தேர்ந்தெடுக்கவும்.',
    bn: 'এই ছবি থেকে জায়গাটি নিশ্চিত করা যায়নি। অন্য কোণ থেকে চেষ্টা করুন অথবা হাতে চেক-ইন করতে “আমি এখানে” বেছে নিন।',
  };
  return {
    match: false,
    placeId: null,
    placeName: '',
    landmark: '',
    confidence: 0,
    reason: reasons[language] || reasons.en,
    fallback: true,
    source: 'fallback',
  };
}

export async function identifyPlace(input = {}) {
  const language = safeLanguage(input.language).split('-')[0];
  const mimeType = text(input.mimeType, 40).toLowerCase();
  const imageBase64 = typeof input.imageBase64 === 'string'
    ? input.imageBase64.replace(/^data:image\/(?:jpeg|png|webp);base64,/i, '').replace(/\s/g, '')
    : '';
  const imageBytes = /^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) ? Buffer.from(imageBase64, 'base64') : Buffer.alloc(0);
  const isJpeg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff;
  const isPng = imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = imageBytes.toString('ascii', 0, 4) === 'RIFF' && imageBytes.toString('ascii', 8, 12) === 'WEBP';
  const signatureMatches = (mimeType === 'image/jpeg' && isJpeg) || (mimeType === 'image/png' && isPng) ||
    (mimeType === 'image/webp' && isWebp);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || !imageBase64 ||
      imageBase64.length > Math.ceil(IMAGE_MAX_BYTES * 4 / 3) || imageBytes.length > IMAGE_MAX_BYTES || !signatureMatches) {
    const error = new Error('Upload a JPEG, PNG, or WebP image smaller than 6 MB.');
    error.status = 400;
    throw error;
  }
  const candidates = [...new Set(Array.isArray(input.candidatePlaceIds) ? input.candidatePlaceIds.slice(0, 12) : [])]
    .map((id) => PLACE_BY_ID.get(id)).filter(Boolean)
    .map((place) => ({ id: place.id, title: place.title, landmarks: getLandmarks(place), context: text(place.overview, 800) }));
  if (!candidates.length) {
    const error = new Error('Choose one or more itinerary places to check against this photo.');
    error.status = 400;
    throw error;
  }
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const schema = {
    ...visionSchema,
    properties: {
      ...visionSchema.properties,
      placeId: { type: 'STRING', nullable: true, enum: candidates.map((candidate) => candidate.id) },
      placeName: { type: 'STRING', enum: ['', ...candidates.map((candidate) => candidate.title)] },
      landmark: { type: 'STRING', enum: ['', ...new Set(candidates.flatMap((candidate) => candidate.landmarks))] },
    },
  };
  try {
    const result = await generateJson({
      schema,
      system: `Identify only a place and landmark visible in the supplied image, choosing from the supplied candidates and their authored landmark names. Do not infer a match from the prompt alone. If uncertain, return match=false, null placeId, empty placeName and landmark, confidence 0. Keep reason to one short statement about visible evidence, written in the user's selected language (${language}). Keep placeName and landmark exactly as candidate values. Return JSON only.`,
      parts: [
        { text: `Candidates (server-authored): ${JSON.stringify(candidates)}` },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    });
    if (!validateVision(result, candidates)) throw new Error('Gemini vision response failed Sarthi validation');
    return { ...result, fallback: false, source: 'gemini' };
  } catch (error) {
    console.warn('[AI] vision fallback:', error.message);
    return visionFallback(language);
  }
}

function normalizePlanInput(input) {
  const trip = input.trip && typeof input.trip === 'object' ? input.trip : {};
  const ids = Array.isArray(input.remainingPlaceIds)
    ? [...new Set(input.remainingPlaceIds.filter((id) => PLACE_BY_ID.has(id)))].slice(0, 30)
    : [];
  const days = Math.max(1, Math.min(7, Number.parseInt(trip.days, 10) || 1));
  return { trip, ids, days, language: safeLanguage(input.language) };
}

function rulePlan({ ids, days, language }) {
  const entries = ids.map((id) => PLACE_BY_ID.get(id));
  const dayBuckets = Array.from({ length: days }, () => []);
  // Preserve submitted order while distributing stops evenly; visit complexity
  // from Sarthi's own place metadata nudges accessible plans toward shorter sites.
  const ranked = entries.slice().sort((a, b) => {
    const walkingWeight = (place) => /high/i.test(place.walkingEffort || '') ? 2 : /low/i.test(place.walkingEffort || '') ? 0 : 1;
    return walkingWeight(a) - walkingWeight(b);
  });
  ranked.forEach((place, index) => dayBuckets[index % days].push(place.id));
  return {
    days: dayBuckets.map((placeIds, dayIndex) => ({ dayIndex, placeIds, note: '' })),
    message: language === 'hi' ? 'आपकी जगहों को दिन के हिसाब से बाँट दिया है।' :
      language === 'ta' ? 'தேர்ந்தெடுத்த இடங்கள் நாட்களாகப் பகிரப்பட்டுள்ளன.' :
      language === 'bn' ? 'আপনার বেছে নেওয়া জায়গাগুলি দিন অনুযায়ী সাজানো হয়েছে।' :
      'Your selected places are arranged across your trip days.',
    fallback: true,
    source: 'fallback',
  };
}

export async function replanTrip(input = {}) {
  const normalized = normalizePlanInput(input);
  const { ids, days, trip, language } = normalized;
  if (!ids.length) return { days: Array.from({ length: days }, (_, dayIndex) => ({ dayIndex, placeIds: [], note: '' })), message: 'Add itinerary places to create a plan.', fallback: true, source: 'fallback' };
  const allowedIds = new Set(ids);
  const places = ids.map((id) => {
    const place = PLACE_BY_ID.get(id);
    return {
      id: place.id,
      title: place.title,
      city: place.city,
      coordinates: place.coords,
      openingHours: place.openingHours,
      visitDuration: place.avgTimeSpent,
      walkingEffort: place.walkingEffort || 'moderate',
      seniorFriendly: Boolean(place.seniorFriendly),
      kidFriendly: Boolean(place.kidFriendly),
      entryFee: place.entryFee,
    };
  });
  try {
    const result = await generateJson({
      schema: planSchema,
      system: `You are Sarthi's itinerary helper. Arrange every allowed place exactly once across the requested days. Use only supplied place IDs and opening hours. Respect pace and accessibility preferences; do not add external places, unsupported travel facts, or invented opening hours. Each note must be a short practical explanation grounded in the supplied data. Return JSON only. User language code: ${language}.`,
      parts: [{ text: JSON.stringify({ trip: {
        days,
        startTime: text(trip.startTime, 10),
        pace: text(trip.pace, 20),
        group: text(trip.group, 40),
        needs: Array.isArray(trip.needs) ? trip.needs.slice(0, 10).map((item) => text(item, 40)) : [],
        interests: Array.isArray(trip.interests) ? trip.interests.slice(0, 10).map((item) => text(item, 40)) : [],
      }, places }) }],
    });
    if (!validatePlan(result, allowedIds, days)) throw new Error('Gemini plan response failed Sarthi validation');
    return { ...result, fallback: false, source: 'gemini' };
  } catch (error) {
    console.warn('[AI] plan fallback:', error.message);
    return rulePlan(normalized);
  }
}

function fallbackAnswer(question, place, facts, language = 'en') {
  const tokens = text(question, 500).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  const stop = new Set(['the', 'and', 'for', 'from', 'with', 'what', 'when', 'where', 'does', 'this', 'that', 'about', 'tell', 'please', 'have', 'how', 'why', 'who', 'built', 'was', 'were', 'is', 'are', 'its', 'tell', 'give', 'show', 'explain']);
  const query = [...new Set(tokens.filter((token) => !stop.has(token)))];
  let best = null;
  let score = 0;
  for (const fact of facts) {
    const body = fact.text.toLowerCase();
    const hits = query.filter((token) => body.includes(token)).length;
    if (hits > score) { score = hits; best = fact; }
  }
  if (best && score >= 1) {
    return { answer: best.text.slice(0, 700), grounded: true, sourceLabels: [best.label], fallback: true, source: 'fallback' };
  }
  const localized = localizePlace(place, language);
  const noAnswer = {
    en: `I don't have a reliable answer to that from Sarthi's notes about ${place.title}. Try asking about its history, architecture, visitor guidelines, or opening hours.`,
    hi: `सारथी के ${localized.localizedName || place.title} से जुड़े नोट्स में इसका भरोसेमंद जवाब नहीं है। इतिहास, वास्तुकला, आगंतुक निर्देश या खुलने के समय के बारे में पूछें।`,
    ta: `சாரதியின் ${localized.localizedName || place.title} குறிப்புகளில் இதற்கான நம்பகமான பதில் இல்லை. வரலாறு, கட்டிடக்கலை, வருகையாளர் வழிகாட்டல் அல்லது திறக்கும் நேரம் பற்றிக் கேளுங்கள்.`,
    bn: `সারথির ${localized.localizedName || place.title} সংক্রান্ত নোটে এর নির্ভরযোগ্য উত্তর নেই। ইতিহাস, স্থাপত্য, দর্শনার্থী নির্দেশিকা বা খোলার সময় সম্পর্কে জিজ্ঞাসা করুন।`,
  };
  return {
    answer: noAnswer[language] || noAnswer.en,
    grounded: false,
    sourceLabels: [],
    fallback: true,
    source: 'fallback',
  };
}

export async function answerQuestion(input = {}) {
  const place = PLACE_BY_ID.get(text(input.placeId, 80));
  const question = text(input.question, 500);
  if (!place || !question) {
    const error = new Error('A supported place and a question are required.');
    error.status = 400;
    throw error;
  }
  const language = safeLanguage(input.language);
  const facts = getPlaceFacts(place, language.split('-')[0]);
  const allowedLabels = new Set(facts.map((fact) => fact.label));
  const schema = {
    ...askSchema,
    properties: {
      ...askSchema.properties,
      sourceLabels: { type: 'ARRAY', items: { type: 'STRING', enum: [...allowedLabels] } },
    },
  };
  try {
    const result = await generateJson({
      schema,
      system: `You answer tourist questions using only the supplied authored Sarthi facts for ${place.title}. Do not use outside knowledge, infer missing facts, or fabricate directions, hours, or fees. If the facts do not answer the question, return grounded=false, an empty answer, and no sourceLabels. Otherwise answer briefly in language ${language}, and include one or more exact source labels. Return JSON only.`,
      parts: [{ text: JSON.stringify({ question, place: place.title, facts }) }],
    });
    if (!validateAsk(result, allowedLabels)) throw new Error('Gemini answer failed Sarthi validation');
    return { ...result, fallback: false, source: 'gemini' };
  } catch (error) {
    console.warn('[AI] ask fallback:', error.message);
    return fallbackAnswer(question, place, facts, language.split('-')[0]);
  }
}

function storyFallback(placeTitles, language, walkedMinutes) {
  const minutes = Math.max(0, Number(walkedMinutes) || 0);
  const joined = placeTitles.join(', ');
  const stories = {
    en: { title: 'A day among Delhi’s stories', summary: `You spent a day discovering ${joined}. The places, pauses, and photos you saved make this journey your own. You walked about ${minutes} minutes and carried a little more of Delhi’s history with you.` },
    hi: { title: 'दिल्ली की कहानियों के बीच एक दिन', summary: `आज आपने ${joined} की सैर की। आपकी जगहें, ठहराव और तस्वीरें इस यात्रा को खास बनाती हैं। आपने लगभग ${minutes} मिनट पैदल चलकर दिल्ली की यादें संजोईं।` },
    ta: { title: 'டெல்லிக் கதைகளுடன் ஒரு நாள்', summary: `இன்று நீங்கள் ${joined} இடங்களைப் பார்த்தீர்கள். நீங்கள் சேமித்த இடங்களும் புகைப்படங்களும் இந்தப் பயணத்தை உங்கள் நினைவாக மாற்றுகின்றன. சுமார் ${minutes} நிமிடங்கள் நடந்தீர்கள்.` },
    bn: { title: 'দিল্লির গল্পে ভরা একটি দিন', summary: `আজ আপনি ${joined} ঘুরে দেখেছেন। আপনার সংরক্ষিত স্থান ও ছবিগুলি এই যাত্রাকে নিজের করে তোলে। আপনি প্রায় ${minutes} মিনিট হেঁটে দিল্লির স্মৃতি সঙ্গে নিয়েছেন।` },
  };
  return { ...(stories[language] || stories.en), fallback: true, source: 'fallback' };
}

export async function createTripStory(input = {}) {
  const language = safeLanguage(input.language);
  const requested = Array.isArray(input.places) ? input.places.slice(0, 12) : [];
  const places = requested.map((entry) => PLACE_BY_ID.get(text(entry?.id, 80))).filter(Boolean);
  if (!places.length) {
    const error = new Error('Add at least one completed place to create a Trip Story.');
    error.status = 400;
    throw error;
  }

  const photos = Array.isArray(input.photos) ? input.photos.slice(0, 6) : [];
  const imageParts = [];
  for (const photo of photos) {
    const place = places.find((entry) => entry.id === photo?.placeId);
    if (!place || typeof photo?.dataUrl !== 'string') continue;
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo.dataUrl);
    if (!match) continue;
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 350 * 1024) continue;
    const mime = match[1];
    const validSignature = (mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8) ||
      (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (mime === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
    if (!validSignature) continue;
    imageParts.push({ text: `Traveler check-in photo for ${place.title}.` });
    imageParts.push({ inlineData: { mimeType: mime, data: match[2] } });
  }

  const titles = places.map((place) => localizePlace(place, language.split('-')[0])?.localizedName || place.title);
  const timeWalkedMinutes = Math.max(0, Math.min(720, Number(input.timeWalkedMinutes) || 0));
  const fallback = storyFallback(titles, language, timeWalkedMinutes);
  try {
    const result = await generateJson({
      schema: storySchema,
      system: `Write a brief, warm personal Trip Story entirely in the user's selected language (${language}), at most 80 words. Use only the supplied completed place names and authored notes. Treat attached photos only as personal trip memories; do not identify people or infer unsupported history, location, or events from an image. Return a short title and summary as JSON.`,
      parts: [
        { text: JSON.stringify({ places: places.map((place) => ({
          title: place.title,
          intro: place.storyContent?.intro || place.overview || '',
          highlights: (place.keyHighlights || []).slice(0, 4),
        })), timeWalkedMinutes, photoCount: imageParts.length }) },
        ...imageParts,
      ],
    });
    if (!validateStory(result)) throw new Error('Gemini story response failed Sarthi validation');
    return { ...result, fallback: false, source: 'gemini' };
  } catch (error) {
    console.warn('[AI] story fallback:', error.message);
    return fallback;
  }
}

