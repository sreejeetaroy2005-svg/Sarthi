/**
 * Translation index — maps monument ID → translated data by language.
 *
 * Usage:
 *   import { getTranslatedChapters, getTranslatedQuestions } from './translations';
 *   const chapters = getTranslatedChapters('humayun-tomb', 'hi');
 *   const questions = getTranslatedQuestions('red-fort', 'ta');
 */

import humayunTombTranslations from './humayun-tomb';
import redFortTranslations from './red-fort';
import authoredRoutes from './authored-routes';

const TRANSLATION_MAP = {
  'humayun-tomb': humayunTombTranslations,
  'red-fort': redFortTranslations,
};

/**
 * Get translated chapter list for a monument + language.
 * Falls back to null if no translation exists (caller should use English).
 */
export function getTranslatedChapters(monumentId, langCode) {
  if (!langCode || langCode === 'en') return null;
  const translations = TRANSLATION_MAP[monumentId];
  if (!translations || !translations[langCode]) return null;
  return translations[langCode].chapters || null;
}

/**
 * Get translated Q&A list for a monument + language.
 * Falls back to null if no translation exists.
 */
export function getTranslatedQuestions(monumentId, langCode) {
  if (!langCode || langCode === 'en') return null;
  const translations = TRANSLATION_MAP[monumentId];
  if (!translations || !translations[langCode]) return null;
  return translations[langCode].questions || null;
}

/**
 * Merge translated chapters onto the English chapter list.
 * Returns a new chapter array where the transcript is replaced with the
 * translated one if available, keeping the English audioSrc and other metadata.
 */
export function mergeChapterTranslations(englishChapters, monumentId, langCode) {
  if (!langCode || langCode === 'en') return englishChapters;

  const translated = getTranslatedChapters(monumentId, langCode);
  if (!translated) return englishChapters;

  return englishChapters.map((enCh) => {
    const trCh = translated.find((t) => t.id === enCh.id);
    if (!trCh) return enCh;
    return {
      ...enCh,
      title: trCh.title || enCh.title,
      transcript: trCh.transcript || enCh.transcript,
      // Clear audioSrc so we force Gnani TTS (pre-generated audio is English-only)
      audioSrc: '',
    };
  });
}

export function mergeWalkingRouteTranslations(englishRoute, monumentId, langCode) {
  const localized = authoredRoutes[monumentId]?.[langCode]?.route;
  if (!localized) return englishRoute;
  return englishRoute.map((stop, index) => ({ ...stop, ...(localized[index] || {}) }));
}

export function getTranslatedVisitorGuidelines(guidelines, monumentId, langCode) {
  const localized = authoredRoutes[monumentId]?.[langCode]?.guidelines;
  return localized ? { ...guidelines, ...localized } : guidelines;
}

