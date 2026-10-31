/**
 * Gnani Controller
 * Request handling and validation for TTS and STT
 */

import * as gnaniService from '../services/gnaniService.js';
import { config } from '../config.js';

export async function handleTTS(req, res) {
  try {
    const payload = req.body;
    if (!payload || !payload.text || !payload.text.trim()) {
      return res.status(400).json({ error: 'Text field is required for TTS synthesis.' });
    }

    const { buffer, contentType, isMock } = await gnaniService.synthesizeSpeech(payload);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'X-Sarthi-Mock-Mode': isMock ? 'true' : 'false',
    });

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[GnaniController] TTS error:', err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: 'TTS synthesis failed',
      details: err.message,
    });
  }
}

export async function handleSTT(req, res) {
  try {
    const contentType = req.headers['content-type'];
    const rawBody = req.rawBody || req.body;

    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return res.status(400).json({ error: 'No audio data received for STT.' });
    }

    const result = await gnaniService.transcribeSpeech(rawBody, contentType);

    res.set({
      'X-Sarthi-Mock-Mode': result.isMock ? 'true' : 'false',
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[GnaniController] STT error:', err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: 'STT transcription failed',
      details: err.message,
    });
  }
}

export function handleHealth(req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'Sarthi Voice Backend',
    timestamp: new Date().toISOString(),
    gnaniConfigured: config.isKeyConfigured(),
    mockMode: !config.isKeyConfigured(),
    supportedLanguages: ['en-IN', 'hi-IN', 'ta-IN', 'bn-IN'],
  });
}

