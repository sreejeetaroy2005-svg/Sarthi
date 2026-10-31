#!/usr/bin/env node
/**
 * Sarthi — Gnani AI Voice TTS Audio Generation Script
 * ====================================================
 * Generates WAV audio for monument tour chapters using Gnani's Timbre v2.5 models.
 *
 * Usage:
 *   node scripts/generate-audio.mjs
 *
 * Requirements:
 *   - Create a .env file at the project root with: GNANI_API_KEY=your_key
 *   - Get your key at: https://api.vachana.ai (X-API-Key-ID)
 *
 * Configuration:
 *   - TARGET_MONUMENTS: Add monument IDs here to generate for more sites
 *   - LANGUAGE: Target language (en-IN, hi-IN, ta-IN, bn-IN)
 *   - VOICE: Matching Timbre v2.5 voice for the language
 *   - OUTPUT_BASE: Where generated WAVs are saved (relative to project root)
 *
 * Re-run safety:
 *   - Chapters with a non-empty audioSrc are SKIPPED automatically
 *   - No unnecessary API calls on re-runs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../backend/config.js';
import { synthesizeSpeech } from '../backend/services/gnaniService.js';

// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────

const TARGET_MONUMENTS = ['humayun-tomb', 'red-fort'];

/** Language & Voice configuration (Timbre v2.5 voices must match preferred language) */
const LANGUAGE_CONFIGS = {
  'en-IN': { voice: 'Devika', label: 'English' },
  'hi-IN': { voice: 'Chitra', label: 'Hindi' },
  'ta-IN': { voice: 'Vedika', label: 'Tamil' },
  'bn-IN': { voice: 'Kirra', label: 'Bengali' },
};

const DEFAULT_LANG = 'en-IN';
const VOICE = LANGUAGE_CONFIGS[DEFAULT_LANG].voice;
const OUTPUT_BASE = 'frontend/public/audio';

// ─────────────────────────────────────────────
//  INTERNAL SETUP
// ─────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Validate API key
if (!config.isKeyConfigured()) {
  console.error('\n❌  GNANI_API_KEY not set.');
  console.error('   Create a .env file at the project root:');
  console.error('   GNANI_API_KEY=your_key_here\n');
  process.exit(1);
}

const MONUMENTS_FILE = fs.existsSync(path.join(PROJECT_ROOT, 'frontend/src/data/monuments.js'))
  ? path.join(PROJECT_ROOT, 'frontend/src/data/monuments.js')
  : path.join(PROJECT_ROOT, 'src/data/monuments.js');

// Load monuments data
const { MONUMENTS } = await import(MONUMENTS_FILE);

// ─────────────────────────────────────────────
//  CORE GENERATION LOGIC (Gnani Timbre v2.5)
// ─────────────────────────────────────────────

async function generateGnaniAudio(text, outputPath, lang = DEFAULT_LANG) {
  const voice = LANGUAGE_CONFIGS[lang]?.voice || 'Devika';
  const { buffer, isMock } = await synthesizeSpeech({
      text,
      voice,
      model: 'timbre-v2.5',
      language: lang,
      speed: 1.0,
      audio_config: {
        sample_rate: 24000,
        num_channels: 1,
        sample_width: 2,
        encoding: 'linear_pcm',
        container: 'wav',
      },
  });
  if (isMock) throw new Error('Gnani is in mock mode; refusing to save demo audio as a real chapter.');
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

// ─────────────────────────────────────────────
//  MAIN RUN
// ─────────────────────────────────────────────

let totalCharsGenerated = 0;
let totalFilesGenerated = 0;
let totalFilesSkipped = 0;
const generatedPaths = {};

console.log('\n🎙️  Sarthi — Gnani AI Voice Audio Generation\n');
console.log(`   Voice: ${VOICE}`);
console.log(`   Model: timbre-v2.5`);
console.log(`   Language: ${DEFAULT_LANG}`);
console.log(`   Targets: ${TARGET_MONUMENTS.join(', ')}\n`);
console.log('─'.repeat(55));

for (const monument of MONUMENTS) {
  if (!TARGET_MONUMENTS.includes(monument.id)) continue;

  console.log(`\n📍 Monument: ${monument.title}`);

  const monumentOutputDir = path.join(PROJECT_ROOT, OUTPUT_BASE, monument.id);
  fs.mkdirSync(monumentOutputDir, { recursive: true });

  generatedPaths[monument.id] = {};

  for (const chapter of (monument.audioChapters || [])) {
    const outputFile = path.join(monumentOutputDir, `${chapter.id}.wav`);
    const publicPath = `/audio/${monument.id}/${chapter.id}.wav`;

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
    process.stdout.write('      Generating with Gnani Timbre v2.5...');

    try {
      const bytes = await generateGnaniAudio(chapter.transcript, outputFile, DEFAULT_LANG);
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
console.log('\n✅  Gnani Generation complete!\n');
console.log(`   Files generated : ${totalFilesGenerated}`);
console.log(`   Files skipped   : ${totalFilesSkipped}`);
console.log(`   Characters used : ${totalCharsGenerated}`);

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
