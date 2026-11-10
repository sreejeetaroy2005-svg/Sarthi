/**
 * Sarthi Backend Server
 * Standalone API server for Gnani Voice AI integration.
 * Supports Express with an automated native Node.js HTTP fallback.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import * as gnaniService from './services/gnaniService.js';
import * as aiService from './services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = fs.existsSync(path.resolve(__dirname, '../frontend/dist'))
  ? path.resolve(__dirname, '../frontend/dist')
  : path.resolve(__dirname, 'dist');
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const GNANI_RATE_LIMIT_MAX = 60;
const rateBuckets = new Map();

function isRateLimited(key, limit = RATE_LIMIT_MAX) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
    if (rateBuckets.size > 1000) {
      for (const [entryKey, entry] of rateBuckets) {
        if (now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) rateBuckets.delete(entryKey);
      }
    }
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let exceeded = false;
    req.on('data', (chunk) => {
      if (exceeded) return;
      size += chunk.length;
      if (size > limitBytes) {
        exceeded = true;
        const error = new Error('Request body is too large.');
        error.status = 413;
        reject(error);
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!exceeded) resolve(Buffer.concat(chunks)); });
    req.on('error', (error) => { if (!exceeded) reject(error); });
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function errorPayload(error, friendly) {
  return { error: friendly, ...(error.status && error.status < 500 ? { details: error.message } : {}) };
}

// Try launching with Express if installed, otherwise run with native Node HTTP
async function startServer() {
  try {
    const expressModule = await import('express');
    const corsModule = await import('cors');
    const express = expressModule.default;
    const cors = corsModule.default;

    const app = express();

    app.use(cors({ origin: config.corsOrigin }));
    app.use('/api', (req, res, next) => {
      const isAi = req.path.startsWith('/ai');
      const key = `${req.ip || req.socket.remoteAddress}:${isAi ? 'ai' : 'gnani'}`;
      if (isRateLimited(key, isAi ? RATE_LIMIT_MAX : GNANI_RATE_LIMIT_MAX)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      }
      next();
    });

    // Routes
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'Sarthi Voice Backend',
        engine: 'Express',
        gnaniConfigured: config.isKeyConfigured(),
        geminiConfigured: config.isGeminiKeyConfigured(),
        mockMode: !config.isKeyConfigured(),
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/api/gnani/health', (req, res) => {
      res.json({
        status: 'ok',
        gnaniConfigured: config.isKeyConfigured(),
        geminiConfigured: config.isGeminiKeyConfigured(),
        mockMode: !config.isKeyConfigured(),
        timestamp: new Date().toISOString(),
      });
    });

    app.post('/api/gnani/tts', express.json({ limit: '64kb' }), async (req, res) => {
      try {
        const payload = req.body;
        if (!payload || !payload.text) {
          return res.status(400).json({ error: 'Missing text in TTS request.' });
        }
        const { buffer, contentType, isMock } = await gnaniService.synthesizeSpeech(payload);
        res.set({
          'Content-Type': contentType,
          'Content-Length': buffer.length,
          'X-Sarthi-Mock-Mode': isMock ? 'true' : 'false',
        });
        return res.status(200).send(buffer);
      } catch (err) {
        console.error('[TTS Error]', err.message);
        return res.status(err.status || 500).json({ error: err.message });
      }
    });

    app.post('/api/gnani/cache-check', express.json({ limit: '256kb' }), (req, res) => {
      const payloads = Array.isArray(req.body?.payloads) ? req.body.payloads : [];
      return res.json({ cached: gnaniService.getCachedSpeechStatus(payloads) });
    });

    app.post('/api/gnani/stt', express.raw({ type: 'multipart/form-data', limit: '12mb' }), async (req, res) => {
      try {
        const rawBody = req.body;
        const contentType = req.headers['content-type'];
        if (!rawBody || rawBody.length === 0) {
          return res.status(400).json({ error: 'No audio data received.' });
        }
        const result = await gnaniService.transcribeSpeech(rawBody, contentType);
        res.set({ 'X-Sarthi-Mock-Mode': result.isMock ? 'true' : 'false' });
        return res.status(200).json(result);
      } catch (err) {
        console.error('[STT Error]', err.message);
        return res.status(err.status || 500).json({ error: err.message });
      }
    });

    app.post('/api/ai/vision', express.json({ limit: '9mb' }), async (req, res) => {
      try {
        return res.json(await aiService.identifyPlace(req.body));
      } catch (err) {
        console.error('[AI Vision Error]', err.message);
        return res.status(err.status || 502).json(errorPayload(err, 'Photo check-in is unavailable right now. Please try again.'));
      }
    });

    app.post('/api/ai/plan', express.json({ limit: '64kb' }), async (req, res) => {
      try {
        return res.json(await aiService.replanTrip(req.body));
      } catch (err) {
        console.error('[AI Plan Error]', err.message);
        return res.status(err.status || 502).json(errorPayload(err, 'Trip planning is unavailable right now. Please try again.'));
      }
    });

    app.post('/api/ai/ask', express.json({ limit: '64kb' }), async (req, res) => {
      try {
        return res.json(await aiService.answerQuestion(req.body));
      } catch (err) {
        console.error('[AI Ask Error]', err.message);
        return res.status(err.status || 502).json(errorPayload(err, 'I could not answer that just now. Please try again.'));
      }
    });

    app.post('/api/ai/story', express.json({ limit: '4mb' }), async (req, res) => {
      try {
        return res.json(await aiService.createTripStory(req.body));
      } catch (err) {
        console.error('[AI Story Error]', err.message);
        return res.status(err.status || 502).json(errorPayload(err, 'Trip Story is unavailable right now. Please try again.'));
      }
    });

    // Serve static frontend build if present
    if (fs.existsSync(DIST_PATH)) {
      app.use(express.static(DIST_PATH));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(DIST_PATH, 'index.html'));
      });
    }

    const server = app.listen(config.port, config.host, () => {
      printBanner('Express');
    });

    return server;
  } catch (err) {
    // If Express is not installed, fall back to native Node HTTP server
    console.log('[Sarthi Backend] Express not found, using native Node.js HTTP server...');
    return startNativeServer();
  }
}

/**
 * Native Node.js HTTP server fallback (Zero external dependencies needed!)
 */
function startNativeServer() {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'POST' && pathname.startsWith('/api/')) {
      const category = pathname.startsWith('/api/ai/') ? 'ai' : 'gnani';
      const limit = category === 'ai' ? RATE_LIMIT_MAX : GNANI_RATE_LIMIT_MAX;
      if (isRateLimited(`${req.socket.remoteAddress}:${category}`, limit)) {
        return sendJson(res, 429, { error: 'Too many requests. Please wait a moment and try again.' });
      }
    }

    if (req.method === 'GET' && (pathname === '/api/health' || pathname === '/api/gnani/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        service: 'Sarthi Voice Backend',
        engine: 'Native Node.js HTTP',
        gnaniConfigured: config.isKeyConfigured(),
        geminiConfigured: config.isGeminiKeyConfigured(),
        mockMode: !config.isKeyConfigured(),
        timestamp: new Date().toISOString(),
      }));
    }

    // AI proxies are served in both Express and the native fallback.
    if (req.method === 'POST' && ['/api/ai/vision', '/api/ai/plan', '/api/ai/ask', '/api/ai/story'].includes(pathname)) {
      try {
        const maxBytes = pathname.endsWith('/vision') ? 9 * 1024 * 1024 : pathname.endsWith('/story') ? 4 * 1024 * 1024 : 64 * 1024;
        const raw = await readBody(req, maxBytes);
        const body = JSON.parse(raw.toString('utf8') || '{}');
        const result = pathname.endsWith('/vision') ? await aiService.identifyPlace(body)
          : pathname.endsWith('/plan') ? await aiService.replanTrip(body)
            : pathname.endsWith('/ask') ? await aiService.answerQuestion(body)
              : await aiService.createTripStory(body);
        return sendJson(res, 200, result);
      } catch (err) {
        console.error('[AI Proxy Error]', err.message);
        return sendJson(res, err.status || 502, errorPayload(err, 'Sarthi AI is unavailable right now. Please try again.'));
      }
    }

    // POST /api/gnani/tts
    if (req.method === 'POST' && pathname === '/api/gnani/tts') {
      try {
        const raw = await readBody(req, 64 * 1024);
        const payload = JSON.parse(raw.toString('utf8') || '{}');
        if (!payload.text) return sendJson(res, 400, { error: 'Missing text in TTS request.' });
        const { buffer, contentType, isMock } = await gnaniService.synthesizeSpeech(payload);
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': buffer.length, 'X-Sarthi-Mock-Mode': isMock ? 'true' : 'false' });
        return res.end(buffer);
      } catch (err) {
        console.error('[TTS Error]', err.message);
        return sendJson(res, err.status || 500, { error: err.message });
      }
    }

    // POST /api/gnani/cache-check
    if (req.method === 'POST' && pathname === '/api/gnani/cache-check') {
      try {
        const raw = await readBody(req, 256 * 1024);
        const body = JSON.parse(raw.toString('utf8') || '{}');
        const payloads = Array.isArray(body.payloads) ? body.payloads : [];
        return sendJson(res, 200, { cached: gnaniService.getCachedSpeechStatus(payloads) });
      } catch (err) {
        return sendJson(res, err.status || 400, { error: err.message });
      }
    }

    // POST /api/gnani/stt
    if (req.method === 'POST' && pathname === '/api/gnani/stt') {
      try {
        const rawBuffer = await readBody(req, 12 * 1024 * 1024);
        if (rawBuffer.length === 0) return sendJson(res, 400, { error: 'No audio data received.' });
        const result = await gnaniService.transcribeSpeech(rawBuffer, req.headers['content-type']);
        res.writeHead(200, { 'Content-Type': 'application/json', 'X-Sarthi-Mock-Mode': result.isMock ? 'true' : 'false' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[STT Error]', err.message);
        return sendJson(res, err.status || 500, { error: err.message });
      }
    }

    // Serve static files from dist if available
    if (req.method === 'GET' && fs.existsSync(DIST_PATH)) {
      const filePath = path.join(DIST_PATH, pathname === '/' ? 'index.html' : pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.wav': 'audio/wav',
          '.mp3': 'audio/mpeg',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }
      // SPA Fallback
      const indexPath = path.join(DIST_PATH, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return fs.createReadStream(indexPath).pipe(res);
      }
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Cannot ${req.method} ${pathname}` }));
  });

  server.listen(config.port, config.host, () => {
    printBanner('Native Node HTTP');
  });

  return server;
}

function printBanner(engine) {
  console.log(`[AI] Gemini model: ${config.geminiModel}`);
  console.log('\n========================================================');
  console.log(`🚀 Sarthi Voice Backend running (${engine})`);
  console.log(`📍 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
  console.log(`🎙️  TTS API: POST http://localhost:${config.port}/api/gnani/tts`);
  console.log(`🎤 STT API: POST http://localhost:${config.port}/api/gnani/stt`);
  console.log(`🔑 Gnani Key: ${config.isKeyConfigured() ? 'CONFIGURED ✓' : 'NOT FOUND (Mock mode active ⚠️)'}`);
  console.log('========================================================\n');
}

startServer();

