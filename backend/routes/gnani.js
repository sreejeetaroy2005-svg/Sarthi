/**
 * Gnani Routes
 * Exposes /api/gnani/tts, /api/gnani/stt, and /api/gnani/health
 */

import { handleTTS, handleSTT, handleHealth } from '../controllers/gnaniController.js';

export function registerGnaniRoutes(router) {
  router.get('/health', handleHealth);
  router.post('/tts', handleTTS);
  router.post('/stt', handleSTT);
  return router;
}

