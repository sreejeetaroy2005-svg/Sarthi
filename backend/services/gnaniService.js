/**
 * Gnani Service
 * Handles outbound requests to https://api.vachana.ai with X-API-Key-ID injection,
 * retry logic with exponential backoff for transient errors, and mock fallbacks.
 */

import { createHash } from 'node:crypto';
import { config } from '../config.js';

const isRetryableStatus = (status) => status === 429 || status >= 500;
const ttsMemoryCache = new Map();
const TTS_CACHE_MAX = 64;

// ─────────────────────────────────────────────────────────────────────
// Global FIFO queue — Gnani allows ONE active request at a time
// ─────────────────────────────────────────────────────────────────────
// Every outbound TTS/STT call chains onto `tail`, so the proxy never has two
// Gnani requests open at once. Retries run inside the queued task, keeping the
// queue blocked during the 0.5s/1s/2s backoff.
let tail = Promise.resolve();
let queueLength = 0;

function enqueue(label, task) {
  queueLength += 1;
  console.log(`[Gnani] queue length: ${queueLength}`);

  const run = () => {
    queueLength -= 1;
    console.log(`[Gnani] start ${label} (queue length: ${queueLength})`);
    return task();
  };

  const result = tail.then(run, run);
  // Keep the chain alive after failures so later requests still run.
  tail = result.catch(() => {});
  return result;
}

// ── In-flight de-duplication: key → promise ─────────────────────────
const inFlight = new Map();

function shareInFlight(key, start) {
  const pending = inFlight.get(key);
  if (pending) {
    console.log('[Gnani] reusing in-flight request');
    return pending;
  }

  const promise = start();
  inFlight.set(key, promise);
  const clear = () => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  };
  promise.then(clear, clear);
  return promise;
}

/**
 * Fetch with exponential backoff retry for 429 and 5xx errors
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (isRetryableStatus(response.status) && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500;
        console.warn(`[GnaniService] ${response.status} from ${url}. Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const errorText = await response.text().catch(() => '');
      const err = new Error(`Gnani API responded with status ${response.status}: ${errorText}`);
      err.status = response.status;
      err.body = errorText;
      throw err;
    } catch (err) {
      lastError = err;
      if (err.status && !isRetryableStatus(err.status)) {
        throw err; // Non-retryable HTTP error
      }
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500;
        console.warn(`[GnaniService] Network error: ${err.message}. Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error(`Gnani API call to ${url} failed after ${maxRetries} retries`);
}

/**
 * Synthesize speech from text via Gnani TTS API
 * @param {object} ttsPayload - { text, voice, model, language, speed, audio_config }
 * @returns {Promise<{ buffer: Buffer, contentType: string, isMock: boolean }>}
 */
export async function synthesizeSpeech(ttsPayload) {
  if (!config.isKeyConfigured()) {
    const error = new Error('Gnani voice is not connected. Configure GNANI_API_KEY to synthesize audio.');
    error.status = 503;
    throw error;
  }

  const normalizedPayload = {
    text: String(ttsPayload.text || '').trim(),
    voice: ttsPayload.voice || 'Devika',
    model: ttsPayload.model || 'timbre-v2.5',
    language: ttsPayload.language || 'en-IN',
    speed: Number.isFinite(Number(ttsPayload.speed)) ? Number(ttsPayload.speed) : 1,
    audio_config: ttsPayload.audio_config || {
      sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav',
    },
  };
  if (!normalizedPayload.text || normalizedPayload.text.length > 5000) {
    const error = new Error('TTS text must be between 1 and 5,000 characters.');
    error.status = 400;
    throw error;
  }
  const key = createHash('sha1').update(JSON.stringify(normalizedPayload)).digest('hex');

  if (ttsMemoryCache.has(key)) {
    const cached = ttsMemoryCache.get(key);
    ttsMemoryCache.delete(key);
    ttsMemoryCache.set(key, cached);
    return cached;
  }

  return shareInFlight(key, () =>
    enqueue('tts', async () => {
      const endpoint = `${config.gnaniBaseUrl}/api/v1/tts/inference`;
      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key-ID': config.gnaniApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedPayload),
      });

      const arrayBuffer = await response.arrayBuffer();
      const result = {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || 'audio/wav',
        isMock: false,
      };
      ttsMemoryCache.set(key, result);
      if (ttsMemoryCache.size > TTS_CACHE_MAX) ttsMemoryCache.delete(ttsMemoryCache.keys().next().value);
      return result;
    })
  );
}

export function getCachedSpeechStatus(payloads = []) {
  return payloads.map((payload) => {
    const normalized = {
      text: String(payload.text || '').trim(),
      voice: payload.voice || 'Devika',
      model: payload.model || 'timbre-v2.5',
      language: payload.language || 'en-IN',
      speed: Number.isFinite(Number(payload.speed)) ? Number(payload.speed) : 1,
      audio_config: payload.audio_config || {
        sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav',
      },
    };
    const key = createHash('sha1').update(JSON.stringify(normalized)).digest('hex');
    return ttsMemoryCache.has(key);
  });
}

/**
 * Transcribe speech audio via Gnani STT API (multipart/form-data)
 * @param {Buffer} rawAudioBuffer - raw multipart or WAV buffer
 * @param {string} contentType - incoming content-type header (including boundary if multipart)
 * @returns {Promise<{ transcript: string, detected_language_code: string, isMock: boolean }>}
 */
export async function transcribeSpeech(rawAudioBuffer, contentType) {
  if (!config.isKeyConfigured()) {
    const error = new Error('Gnani voice is not connected. Configure GNANI_API_KEY to transcribe audio.');
    error.status = 503;
    throw error;
  }

  // Identical upload fired twice → one Gnani call.
  const audioBytes = extractAudioPart(rawAudioBuffer, contentType);
  const key = `stt|${createHash('sha1').update(audioBytes).digest('hex')}`;

  return shareInFlight(key, () =>
    enqueue('stt', async () => {
      const endpoint = `${config.gnaniBaseUrl}/stt/v3`;
      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key-ID': config.gnaniApiKey,
          'Content-Type': contentType || 'multipart/form-data',
        },
        body: rawAudioBuffer,
      });

      const data = await response.json();
      return {
        transcript: data.transcript || '',
        detected_language_code: data.detected_language_code || data.language_code || 'en-IN',
        isMock: false,
      };
    })
  );
}

function extractAudioPart(body, contentType = '') {
  const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || '')?.slice(1).find(Boolean);
  if (!boundary) return body;
  const marker = Buffer.from(`--${boundary}`);
  let cursor = 0;
  while (cursor < body.length) {
    const start = body.indexOf(marker, cursor);
    if (start < 0) break;
    const headerStart = body.indexOf(Buffer.from('\r\n\r\n'), start);
    if (headerStart < 0) break;
    const headerText = body.subarray(start, headerStart).toString('utf8');
    const dataStart = headerStart + 4;
    const next = body.indexOf(marker, dataStart);
    if (next < 0) break;
    let dataEnd = next;
    if (body[dataEnd - 2] === 13 && body[dataEnd - 1] === 10) dataEnd -= 2;
    if (/name="audio_file"/i.test(headerText)) return body.subarray(dataStart, dataEnd);
    cursor = next;
  }
  return body;
}

