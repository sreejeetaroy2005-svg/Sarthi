#!/usr/bin/env node
/**
 * Sarthi — Auto-update audioSrc fields in monuments.js
 * =====================================================
 * Run this AFTER generate-audio.mjs to patch monuments.js automatically.
 *
 * Usage:
 *   node scripts/update-audio-srcs.mjs
 *
 * What it does:
 *   Scans public/audio/ for all <monument-id>/<chapter-id>.mp3 files
 *   that exist on disk, and updates the corresponding audioSrc fields
 *   in src/data/monuments.js.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MONUMENTS_FILE = fs.existsSync(path.join(PROJECT_ROOT, 'frontend/src/data/monuments.js'))
  ? path.join(PROJECT_ROOT, 'frontend/src/data/monuments.js')
  : path.join(PROJECT_ROOT, 'src/data/monuments.js');

const AUDIO_BASE = fs.existsSync(path.join(PROJECT_ROOT, 'frontend/public/audio'))
  ? path.join(PROJECT_ROOT, 'frontend/public/audio')
  : path.join(PROJECT_ROOT, 'public/audio');

console.log('\n🔧  Sarthi — Patching audioSrc fields in monuments.js\n');

if (!fs.existsSync(AUDIO_BASE)) {
  console.log('   ⚠️  public/audio/ not found. Run generate-audio.mjs first.\n');
  process.exit(0);
}

let content = fs.readFileSync(MONUMENTS_FILE, 'utf-8');
let patchCount = 0;

// Walk public/audio/<monument-id>/<chapter-id>.mp3
const monumentDirs = fs.readdirSync(AUDIO_BASE, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const monumentId of monumentDirs) {
  const monumentAudioDir = path.join(AUDIO_BASE, monumentId);
  const audioFiles = fs.readdirSync(monumentAudioDir)
    .filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

  for (const audioFile of audioFiles) {
    const ext = path.extname(audioFile);
    const chapterId = path.basename(audioFile, ext);
    const publicPath = `/audio/${monumentId}/${chapterId}${ext}`;

    // Replace: audioSrc: "" for this chapter only (scoped by chapter id context)
    // We look for id: "chapterId" then the next audioSrc: "" within ~5 lines
    const chapterIdPattern = new RegExp(
      `(id:\\s*"${chapterId}"[\\s\\S]{0,200}?audioSrc:\\s*)"([^"]*)"`,
      'g'
    );

    const before = content;
    content = content.replace(chapterIdPattern, (match, prefix, existingVal) => {
      if (existingVal === '') {
        patchCount++;
        console.log(`   ✅  ${monumentId}/${chapterId} → ${publicPath}`);
        return `${prefix}"${publicPath}"`;
      }
      // Already has a value — skip
      console.log(`   ⏭️  ${monumentId}/${chapterId} — already set (${existingVal})`);
      return match;
    });
  }
}

if (patchCount > 0) {
  fs.writeFileSync(MONUMENTS_FILE, content, 'utf-8');
  console.log(`\n✅  Patched ${patchCount} audioSrc field(s) in src/data/monuments.js\n`);
} else {
  console.log('\n   No empty audioSrc fields found to patch.\n');
}
