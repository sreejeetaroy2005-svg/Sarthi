import { MONUMENTS } from '../frontend/src/data/monuments.js';
import humayunTombTranslations from '../frontend/src/data/translations/humayun-tomb.js';

const API = (process.env.SARTHI_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');
const VOICES = {
  en: { voice: 'Devika', language: 'en-IN' },
  hi: { voice: 'Chitra', language: 'hi-IN' },
  ta: { voice: 'Vedika', language: 'ta-IN' },
  bn: { voice: 'Kirra', language: 'bn-IN' },
};

const monument = MONUMENTS.find((place) => place.id === 'humayun-tomb');
if (!monument) throw new Error('Humayun’s Tomb authored content was not found.');

const items = [];
for (const [language, voice] of Object.entries(VOICES)) {
  const translatedChapters = humayunTombTranslations[language]?.chapters || [];
  for (const chapter of monument.audioChapters) {
    const localized = translatedChapters.find((entry) => entry.id === chapter.id);
    const text = localized?.transcript || chapter.transcript;
    items.push({ kind: `chapter ${chapter.id}`, language, voice, text });
  }

  const questions = language === 'en'
    ? [
        'The red sandstone was sourced from Rajasthan, symbolizing imperial grandeur and power, contrasted with white marble representing spiritual purity.',
        'The main entrance is the West Gate where you entered. There is also a South Gate, which was traditionally reserved for the royal family.',
        'The central chamber houses the cenotaph of Emperor Humayun. The surrounding chambers contain graves of his wives and later Mughal princes.',
        'It is the direct architectural prototype of the Taj Mahal. The double-dome and Charbagh gardens were scaled up 60 years later by Shah Jahan.',
      ]
    : (humayunTombTranslations[language]?.questions || []).map((entry) => entry.a);
  questions.forEach((text, index) => items.push({ kind: `Q&A ${index + 1}`, language, voice, text }));
}

const payloads = items.map(({ text, voice }) => ({
  text,
  voice: voice.voice,
  language: voice.language,
  model: 'timbre-v2.5',
  speed: 1,
  audio_config: {
    sample_rate: 24000,
    num_channels: 1,
    sample_width: 2,
    encoding: 'linear_pcm',
    container: 'wav',
  },
}));

const healthResponse = await fetch(`${API}/gnani/health`);
if (!healthResponse.ok) throw new Error(`Gnani health check failed (${healthResponse.status}).`);
const health = await healthResponse.json();
if (!health.gnaniConfigured || health.mockMode) {
  throw new Error('Gnani is not connected. warm-demo will not generate mock audio.');
}

const cacheResponse = await fetch(`${API}/gnani/cache-check`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payloads }),
});
if (!cacheResponse.ok) throw new Error(`Gnani cache check failed (${cacheResponse.status}).`);
const { cached = [] } = await cacheResponse.json();

let charactersUsed = 0;
let warmed = 0;
for (let index = 0; index < items.length; index += 1) {
  const item = items[index];
  if (cached[index]) {
    console.log(`SKIP cached ${item.kind} (${item.language})`);
    continue;
  }

  const response = await fetch(`${API}/gnani/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloads[index]),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`TTS failed for ${item.kind} (${item.language}), HTTP ${response.status}: ${detail.slice(0, 180)}`);
  }
  if (response.headers.get('X-Sarthi-Mock-Mode') === 'true') {
    throw new Error('Proxy returned mock audio; stopping warm-up.');
  }
  await response.arrayBuffer();
  charactersUsed += item.text.length;
  warmed += 1;
  console.log(`WARM ${item.kind} (${item.language}) — ${item.text.length} characters; ${charactersUsed} new characters total`);
}

console.log(`Warm-up complete: ${warmed} generated, ${items.length - warmed} already cached, ${charactersUsed} characters sent to Gnani.`);
