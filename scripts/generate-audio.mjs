#!/usr/bin/env node
/**
 * Sarthi — ElevenLabs TTS Audio Generation Script
 * ================================================
 * Generates real MP3 narration audio for monument tour chapters.
 *
 * Usage:
 *   node scripts/generate-audio.mjs
 *
 * Requirements:
 *   - Create a .env file at the project root with: ELEVENLABS_API_KEY=sk_...
 *   - Get your key at: https://elevenlabs.io/app/settings/api-keys
 *
 * Configuration:
 *   - TARGET_MONUMENTS: Add monument IDs here to generate for more sites
 *   - VOICE_ID: Change to any ElevenLabs voice ID
 *   - OUTPUT_BASE: Where generated MP3s are saved (relative to project root)
 *
 * Re-run safety:
 *   - Chapters with a non-empty audioSrc are SKIPPED automatically
 *   - No credits wasted on re-runs
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─────────────────────────────────────────────
//  CONFIGURATION — edit these to extend scope
// ─────────────────────────────────────────────

/** Add monument IDs here to generate audio for additional monuments */
const TARGET_MONUMENTS = ['humayun-tomb'];

/** ElevenLabs Voice ID to use for narration.
 *  Default: "Rachel" — warm, clear narration voice (built-in, free tier)
 *  Browse voices at: https://elevenlabs.io/app/voice-library
 */
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

/** ElevenLabs model — 'eleven_multilingual_v2' for best quality */
const MODEL_ID = 'eleven_multilingual_v2';

/** Output directory for generated MP3s (relative to project root) */
const OUTPUT_BASE = 'public/audio';

// ─────────────────────────────────────────────
//  INTERNAL SETUP
// ─────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Validate API key
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY || API_KEY === 'your_elevenlabs_api_key_here') {
  console.error('\n❌  ELEVENLABS_API_KEY not set.');
  console.error('   Create a .env file at the project root:');
  console.error('   ELEVENLABS_API_KEY=sk_...\n');
  process.exit(1);
}

// Load monuments data (read as text and parse — avoids ESM import issues)
const monumentsSrc = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src/data/monuments.js'),
  'utf-8'
);

// Extract the MONUMENTS array via eval-safe approach (dynamic import of module)
// Since monuments.js uses ES module export, we use a temporary dynamic import
const { MONUMENTS } = await import(
  path.join(PROJECT_ROOT, 'src/data/monuments.js')
);

// ─────────────────────────────────────────────
//  CORE GENERATION LOGIC
// ─────────────────────────────────────────────

const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

async function generateAudio(text, outputPath) {
  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.80,
        style: 0.20,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  return buffer.byteLength;
}

// ─────────────────────────────────────────────
//  MAIN RUN
// ─────────────────────────────────────────────

let totalCharsGenerated = 0;
let totalFilesGenerated = 0;
let totalFilesSkipped = 0;
const generatedPaths = {};

console.log('\n🎙️  Sarthi — ElevenLabs Audio Generation\n');
console.log(`   Voice: ${VOICE_ID} (Rachel)`);
console.log(`   Model: ${MODEL_ID}`);
console.log(`   Targets: ${TARGET_MONUMENTS.join(', ')}\n`);
console.log('─'.repeat(55));

for (const monument of MONUMENTS) {
  if (!TARGET_MONUMENTS.includes(monument.id)) continue;

  console.log(`\n📍 Monument: ${monument.title}`);

  const monumentOutputDir = path.join(PROJECT_ROOT, OUTPUT_BASE, monument.id);
  fs.mkdirSync(monumentOutputDir, { recursive: true });

  generatedPaths[monument.id] = {};

  for (const chapter of monument.audioChapters) {
    const outputFile = path.join(monumentOutputDir, `${chapter.id}.mp3`);
    const publicPath = `/audio/${monument.id}/${chapter.id}.mp3`;

    // Skip if audioSrc is already set (idempotent re-run protection)
    if (chapter.audioSrc && chapter.audioSrc.trim() !== '') {
      console.log(`   ⏭️  Ch ${chapter.id} — SKIPPED (audioSrc already set: ${chapter.audioSrc})`);
      totalFilesSkipped++;
      generatedPaths[monument.id][chapter.id] = chapter.audioSrc;
      continue;
    }

    // Also skip if the file already exists on disk
    if (fs.existsSync(outputFile)) {
      console.log(`   ⏭️  Ch ${chapter.id} — SKIPPED (file already exists: ${publicPath})`);
      totalFilesSkipped++;
      generatedPaths[monument.id][chapter.id] = publicPath;
      continue;
    }

    const charCount = chapter.transcript.length;
    console.log(`   🔄 Ch ${chapter.id}: "${chapter.title}" — ${charCount} chars`);
    process.stdout.write('      Generating...');

    try {
      const bytes = await generateAudio(chapter.transcript, outputFile);
      totalCharsGenerated += charCount;
      totalFilesGenerated++;
      generatedPaths[monument.id][chapter.id] = publicPath;
      console.log(` ✅  Saved (${(bytes / 1024).toFixed(1)} KB) → ${publicPath}`);
    } catch (err) {
      console.log(` ❌  FAILED: ${err.message}`);
      process.exit(1);
    }
  }
}

// ─────────────────────────────────────────────
//  SUMMARY & INSTRUCTIONS
// ─────────────────────────────────────────────

console.log('\n' + '─'.repeat(55));
console.log('\n✅  Generation complete!\n');
console.log(`   Files generated : ${totalFilesGenerated}`);
console.log(`   Files skipped   : ${totalFilesSkipped}`);
console.log(`   Characters used : ${totalCharsGenerated}`);
console.log(`   Credits used    : ~${totalCharsGenerated} / 10,000 (${((totalCharsGenerated / 10000) * 100).toFixed(1)}% of free tier)`);

if (totalFilesGenerated > 0) {
  console.log('\n─'.repeat(55));
  console.log('\n📋  Now update audioSrc in src/data/monuments.js:\n');

  for (const [monumentId, chapters] of Object.entries(generatedPaths)) {
    console.log(`   Monument: ${monumentId}`);
    for (const [chapterId, filePath] of Object.entries(chapters)) {
      console.log(`     ${chapterId}: "${filePath}"`);
    }
  }

  console.log('\n   Run this to auto-update the file:');
  console.log('   node scripts/update-audio-srcs.mjs\n');
}
