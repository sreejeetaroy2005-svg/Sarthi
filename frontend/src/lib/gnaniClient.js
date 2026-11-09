/**
 * Gnani Voice AI client — browser-side helper that calls the server-side proxy.
 *
 * • synthesize(text, langCode, { signal }) → playable Blob URL (cached by lang+text)
 * • transcribe(wavBlob, { signal })        → { transcript, detectedLanguage }
 *
 * The proxy at /api/gnani/* injects the GNANI_API_KEY header server-side
 * so the key is never exposed to the browser.
 *
 * Gnani only allows ONE active request at a time ("429 RATE_LIMITED: Only 1
 * active request is allowed at a time."), so every TTS/STT call goes through
 * the global FIFO queue below. Identical in-flight calls share one promise,
 * and generated audio is cached in memory + IndexedDB so a reload never
 * re-spends credits.
 */

// ── API Base URL (defaults to /api, customizable via VITE_API_BASE_URL) ──
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// ── Language → Gnani voice/locale mapping ────────────────────────────
const LANG_CONFIG = {
  en: { voice: 'Devika',  locale: 'en-IN', label: 'English' },
  hi: { voice: 'Chitra',  locale: 'hi-IN', label: 'हिन्दी' },
  ta: { voice: 'Vedika',  locale: 'ta-IN', label: 'தமிழ்' },
  bn: { voice: 'Kirra',   locale: 'bn-IN', label: 'বাংলা' },
};

export function getGnaniLocale(langCode) {
  return LANG_CONFIG[langCode]?.locale || 'en-IN';
}

export function getGnaniVoice(langCode) {
  return LANG_CONFIG[langCode]?.voice || 'Devika';
}

export function getSupportedLanguages() {
  return Object.entries(LANG_CONFIG).map(([code, cfg]) => ({
    code,
    ...cfg,
  }));
}

// ─────────────────────────────────────────────────────────────────────
// Global FIFO queue — exactly one Gnani request (TTS or STT) at a time
// ─────────────────────────────────────────────────────────────────────
// Every request chains onto `tail`, so callers are served strictly in the
// order they asked. Retries happen inside the queued task, which keeps the
// queue blocked until the retry settles: no new request can start while a
// 429 backoff is pending.
let tail = Promise.resolve();
let queueLength = 0;
const activeAbortControllers = new Set();

// Ending a trip aborts active Gnani fetches and makes queued work no-op.
let queueGeneration = 0;
export function cancelGnaniRequests() {
  queueGeneration += 1;
  activeAbortControllers.forEach((controller) => controller.abort());
  activeAbortControllers.clear();
  inFlight.clear();
}

function enqueue(label, task) {
  queueLength += 1;
  console.log(`[Gnani] queue length: ${queueLength}`);
  const generation = queueGeneration;

  const run = () => {
    queueLength -= 1;
    console.log(`[Gnani] start ${label} (queue length: ${queueLength})`);
    if (generation !== queueGeneration) return Promise.reject(abortError());
    const controller = new AbortController();
    activeAbortControllers.add(controller);
    return Promise.resolve(task(controller.signal)).finally(() => activeAbortControllers.delete(controller));
  };

  const result = tail.then(run, run);
  // Swallow rejections on the chain itself so one failure never stalls the queue.
  tail = result.catch(() => {});
  return result;
}

// ── In-flight de-duplication: key → promise ─────────────────────────
const inFlight = new Map();

function abortError() {
  const err = new Error('Gnani request aborted');
  err.name = 'AbortError';
  return err;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function combineSignals(first, second) {
  if (!first) return second;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (first.aborted || second.aborted) controller.abort();
  else {
    first.addEventListener('abort', abort, { once: true });
    second.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// ── Memory cache: LRU of playable blob URLs (50 entries max) ─────────
const CACHE_MAX = 50;
const audioCache = new Map(); // key → blob URL

function cacheKey(lang, text) {
  return `${lang}|${text}`;
}

function cacheGet(key) {
  if (!audioCache.has(key)) return null;
  const url = audioCache.get(key);
  // Refresh LRU order.
  audioCache.delete(key);
  audioCache.set(key, url);
  return url;
}

function cacheSet(key, url) {
  if (audioCache.has(key)) {
    URL.revokeObjectURL(audioCache.get(key));
    audioCache.delete(key);
  } else if (audioCache.size >= CACHE_MAX) {
    const oldest = audioCache.keys().next().value;
    URL.revokeObjectURL(audioCache.get(oldest));
    audioCache.delete(oldest);
  }
  audioCache.set(key, url);
}

// ── Persistent cache: IndexedDB (Blobs survive page reloads) ─────────
// localStorage can't hold ~3 MB of WAV per chapter, so audio lives in IDB.
const IDB_NAME = 'sarthi-gnani-media';
const IDB_STORE = 'tts';
const IDB_MAX_ENTRIES = 40;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);

    let req;
    try {
      req = indexedDB.open(IDB_NAME, 1);
    } catch {
      return resolve(null);
    }

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });

  return dbPromise;
}

async function idbGetBlob(key) {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPutBlob(key, blob) {
  const db = await openDb();
  if (!db) return;

  await new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ blob, ts: Date.now() }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });

  pruneIdb(db).catch(() => {});
}

async function pruneIdb(db) {
  const entries = await new Promise((resolve) => {
    try {
      const out = [];
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        out.push({ key: cursor.key, ts: cursor.value?.ts || 0 });
        cursor.continue();
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve([]);
    }
  });

  if (entries.length <= IDB_MAX_ENTRIES) return;

  const excess = entries
    .sort((a, b) => a.ts - b.ts)
    .slice(0, entries.length - IDB_MAX_ENTRIES);

  await new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      excess.forEach(({ key }) => store.delete(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ── Sequential retry (0.5s, 1s, 2s) — runs inside the queued task ────
const RETRY_DELAYS = [500, 1000, 2000];

async function backoff(attempt, label, reason, signal) {
  const wait = RETRY_DELAYS[attempt];
  console.warn(
    `[Gnani] ${label} ${reason} — retrying sequentially in ${wait}ms ` +
    `(${attempt + 1}/${RETRY_DELAYS.length})`
  );
  // The queue stays blocked during this wait on purpose.
  await sleep(wait, signal);
}

async function requestWithRetry(url, init, signal, label) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    throwIfAborted(signal);

    let res = null;
    try {
      res = await fetch(url, { ...init, signal });
    } catch (err) {
      if (signal?.aborted || err.name === 'AbortError') throw abortError();
      lastError = err;
      if (attempt < RETRY_DELAYS.length) {
        await backoff(attempt, label, `network error (${err.message})`, signal);
        continue;
      }
      throw err;
    }

    if (res.ok) return res;

    const detail = await res.text().catch(() => '');
    lastError = new Error(
      `Gnani ${label} failed with ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`
    );

    // 429 = another request is still active; 5xx = transient upstream failure.
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < RETRY_DELAYS.length) {
      await backoff(attempt, label, `got ${res.status}`, signal);
      continue;
    }

    throw lastError;
  }

  throw lastError || new Error(`Gnani ${label} request failed`);
}

// ── TTS: text → playable Blob URL ────────────────────────────────────
/**
 * @param {string} text
 * @param {string} langCode - 'en' | 'hi' | 'ta' | 'bn'
 * @param {{ signal?: AbortSignal }} [options] - abort to skip the queued request
 * @returns {Promise<string>} blob URL
 */
export function synthesize(text, langCode = 'en', options = {}) {
  const { signal } = options;

  if (!text || !text.trim()) {
    return Promise.reject(new Error('Empty text for TTS'));
  }

  const trimmed = text.trim();
  const key = cacheKey(langCode, trimmed);

  // 1. Memory cache (instant, no network).
  const memoryUrl = cacheGet(key);
  if (memoryUrl) return Promise.resolve(memoryUrl);

  // 2. Identical request already in flight → reuse its promise.
  const pending = inFlight.get(key);
  if (pending) {
    console.log('[Gnani] reusing in-flight TTS request');
    return pending;
  }

  // 3. Queue it — only one Gnani request may be active at a time.
  const promise = enqueue('tts', async (queueSignal) => {
    const requestSignal = combineSignals(signal, queueSignal);
    throwIfAborted(requestSignal);

    // Persistent cache: survives reloads, so credits are never re-spent.
    const stored = await idbGetBlob(key);
    if (stored) {
      throwIfAborted(requestSignal);
      const url = URL.createObjectURL(stored);
      cacheSet(key, url);
      return url;
    }

    throwIfAborted(requestSignal);

    const config = LANG_CONFIG[langCode] || LANG_CONFIG.en;

    const body = {
      text: trimmed,
      voice: config.voice,
      model: 'timbre-v2.5',
      language: config.locale,
      speed: 1.0,
      audio_config: {
        sample_rate: 24000,
        num_channels: 1,
        sample_width: 2,
        encoding: 'linear_pcm',
        container: 'wav',
      },
    };

    const res = await requestWithRetry(
      `${API_BASE}/gnani/tts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      requestSignal,
      'TTS'
    );

    if (res.headers.get('X-Sarthi-Mock-Mode') === 'true') {
      throw new Error('Gnani is in demo mode; use the browser speech fallback.');
    }

    const blob = await res.blob();

    // Credits are already spent, so persist even if the caller moved on.
    await idbPutBlob(key, blob);

    const url = URL.createObjectURL(blob);
    cacheSet(key, url);
    return url;
  });

  inFlight.set(key, promise);
  const clear = () => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  };
  promise.then(clear, clear);
  // If this caller aborts, drop the shared entry so a later call can retry.
  signal?.addEventListener('abort', clear, { once: true });

  return promise;
}

// ── STT: WAV Blob → { transcript, detectedLanguage } ─────────────────
/**
 * @param {Blob} wavBlob
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function transcribe(wavBlob, options = {}) {
  const { signal } = options;

  if (!wavBlob || wavBlob.size === 0) {
    return Promise.reject(new Error('Empty audio for STT'));
  }

  // Same recording fired twice (StrictMode / double tap) → same promise.
  const bytes = await wavBlob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const key = `stt|${fingerprint}`;

  const pending = inFlight.get(key);
  if (pending) {
    console.log('[Gnani] reusing in-flight STT request');
    return pending;
  }

  const promise = enqueue('stt', async (queueSignal) => {
    const requestSignal = combineSignals(signal, queueSignal);
    throwIfAborted(requestSignal);

    const formData = new FormData();
    formData.append('audio_file', wavBlob, 'recording.wav');
    formData.append('model', 'prisma-v3.0');
    formData.append('language_code', 'indic-auto'); // auto-detect among supported Indian languages

    const res = await requestWithRetry(
      `${API_BASE}/gnani/stt`,
      { method: 'POST', body: formData },
      requestSignal,
      'STT'
    );

    const data = await res.json();
    return {
      transcript: data.transcript || '',
      detectedLanguage: data.detected_language_code || 'en-IN',
    };
  });

  inFlight.set(key, promise);
  const clear = () => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  };
  promise.then(clear, clear);
  signal?.addEventListener('abort', clear, { once: true });

  return promise;
}

// ── Utility: detect short lang code from Gnani locale ─────────────────
export function localeToLangCode(gnaniLocale) {
  if (!gnaniLocale) return 'en';
  const prefix = gnaniLocale.split('-')[0];
  return LANG_CONFIG[prefix] ? prefix : 'en';
}

// ── Utility: "no match" polite message per language ───────────────────
export function getNoMatchMessage(langCode) {
  const messages = {
    en: "I'm sorry, I didn't understand that question. Could you try asking in a different way?",
    // TRANSLATION-REVIEW: Hindi — "no match" message
    hi: "क्षमा करें, मैं आपका प्रश्न समझ नहीं पाया। कृपया दूसरे तरीके से पूछें।",
    // TRANSLATION-REVIEW: Tamil — "no match" message
    ta: "மன்னிக்கவும், உங்கள் கேள்வியைப் புரிந்துகொள்ள முடியவில்லை. வேறு விதமாகக் கேட்கவும்.",
    // TRANSLATION-REVIEW: Bengali — "no match" message
    bn: "দুঃখিত, আপনার প্রশ্নটি বুঝতে পারিনি। অন্যভাবে জিজ্ঞাসা করার চেষ্টা করুন।",
  };
  return messages[langCode] || messages.en;
}

// ── Utility: mic-denied message per language ──────────────────────────
export function getMicDeniedMessage(langCode) {
  const messages = {
    en: "Microphone access was denied. Please allow microphone permission in your browser settings to use voice features.",
    // TRANSLATION-REVIEW: Hindi — mic denied
    hi: "माइक्रोफ़ोन का उपयोग अस्वीकृत है। कृपया अपनी ब्राउज़र सेटिंग में माइक्रोफ़ोन अनुमति दें।",
    // TRANSLATION-REVIEW: Tamil — mic denied
    ta: "மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. குரல் அம்சங்களைப் பயன்படுத்த உலாவி அமைப்புகளில் அனுமதிக்கவும்.",
    // TRANSLATION-REVIEW: Bengali — mic denied
    bn: "মাইক্রোফোন অ্যাক্সেস অস্বীকার করা হয়েছে। ভয়েস ফিচার ব্যবহার করতে ব্রাউজার সেটিংসে মাইক্রোফোন অনুমতি দিন।",
  };
  return messages[langCode] || messages.en;
}

export function getCameraDeniedMessage(langCode) {
  const messages = {
    en: 'Camera access is unavailable. Allow camera permission in your browser, or choose a saved photo instead.',
    // TRANSLATION-REVIEW: Hindi — camera denied
    hi: 'कैमरा उपलब्ध नहीं है। ब्राउज़र में कैमरा अनुमति दें या पहले से ली गई फ़ोटो चुनें।',
    // TRANSLATION-REVIEW: Tamil — camera denied
    ta: 'கேமரா அணுகல் கிடைக்கவில்லை. உலாவியில் அனுமதி அளிக்கவும் அல்லது சேமித்த படத்தைத் தேர்ந்தெடுக்கவும்.',
    // TRANSLATION-REVIEW: Bengali — camera denied
    bn: 'ক্যামেরা ব্যবহার করা যাচ্ছে না। ব্রাউজারে অনুমতি দিন অথবা সংরক্ষিত ছবি বেছে নিন।',
  };
  return messages[langCode] || messages.en;
}

// ── Utility: empty STT message per language ───────────────────────────
export function getEmptyTranscriptMessage(langCode) {
  const messages = {
    en: "I didn't catch that. Could you please speak again?",
    // TRANSLATION-REVIEW: Hindi — empty transcript
    hi: "मैं सुन नहीं पाया। कृपया फिर से बोलें।",
    // TRANSLATION-REVIEW: Tamil — empty transcript
    ta: "நான் கேட்கவில்லை. மீண்டும் பேசுங்கள்.",
    // TRANSLATION-REVIEW: Bengali — empty transcript
    bn: "শুনতে পাইনি। অনুগ্রহ করে আবার বলুন।",
  };
  return messages[langCode] || messages.en;
}
