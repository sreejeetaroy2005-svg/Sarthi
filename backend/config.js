/**
 * Backend Configuration
 * Reads from process.env (loaded via dotenv from backend/.env or ../.env)
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = __dirname;
const ROOT_DIR = path.resolve(__dirname, '..');

// Check backend/.env then ../.env
const candidateEnvPaths = [
  path.join(BACKEND_DIR, '.env'),
  path.join(ROOT_DIR, '.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: envPath });
    } catch {
      // Manual fallback parser if dotenv isn't installed
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  host: process.env.HOST || '0.0.0.0',
  gnaniApiKey: process.env.GNANI_API_KEY || '',
  gnaniBaseUrl: process.env.GNANI_BASE_URL || 'https://api.vachana.ai',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  isKeyConfigured() {
    return Boolean(
      this.gnaniApiKey &&
      this.gnaniApiKey !== 'your_gnani_api_key_here' &&
      this.gnaniApiKey.trim() !== ''
    );
  },
  isGeminiKeyConfigured() {
    return Boolean(this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key_here' && this.geminiApiKey.trim());
  },
};
