# Sarthi Backend

Node.js API server for Gnani voice services and grounded Gemini helpers. API keys are read only by this server and are never imported by the browser app.

## Configure

Set these in the repository root `.env`, `backend/.env`, or the server environment:

```env
PORT=5001
GNANI_API_KEY=your_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
CORS_ORIGIN=http://localhost:3000
```

The root environment file is loaded by `backend/config.js`. Never add provider keys to a `VITE_*` variable.

## Run

From the repository root, `npm run dev` starts both the backend and Vite. Or run `npm run dev:backend` and `npm run dev:frontend` in separate terminals. `npm start` starts the backend and serves `frontend/dist` when a production build exists.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Reports service and key configured flags, never key values |
| `POST` | `/api/gnani/tts` | Server-side Gnani Timbre v2.5 proxy; returns audio bytes |
| `POST` | `/api/gnani/stt` | Server-side Gnani Prisma v3 proxy; accepts multipart audio |
| `POST` | `/api/ai/vision` | Matches a photo against server-authored itinerary candidates |
| `POST` | `/api/ai/plan` | Suggests a day arrangement for known Sarthi places |
| `POST` | `/api/ai/ask` | Answers a question from authored facts for one known place |

Gemini endpoints return schema-validated JSON. On provider errors or invalid output, the service returns a rules-based response with `fallback: true`. Photo fallback never claims a match. Photo bodies accept JPEG, PNG, or WebP up to 6 MB; STT is limited to 12 MB; other JSON calls are limited to 64 KB. A process-local rate limit allows 20 API requests per minute per IP and service group.

All Gnani calls share one server-side FIFO queue, de-duplicate identical in-flight requests, cache TTS audio in memory (the frontend also caches audio in memory and IndexedDB), and retry 429/5xx or network errors sequentially.

## Demo mode

If `GNANI_API_KEY` or `GEMINI_API_KEY` is missing, the matching feature uses its local fallback. `GET /api/health` indicates whether each key is configured without exposing secret material.
