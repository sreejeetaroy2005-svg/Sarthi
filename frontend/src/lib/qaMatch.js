/**
 * Q&A keyword matcher for LiveGuideView voice Q&A.
 *
 * Uses simple keyword overlap scoring. Structured so an LLM can replace
 * the matching logic later — just swap the matchQuestion() implementation.
 *
 * Usage:
 *   import { matchQuestion } from './qaMatch';
 *   const result = matchQuestion(transcript, 'humayun-tomb', 'hi');
 *   // result: { answer, confidence } or null
 */

import { getTranslatedQuestions } from '../data/translations';

// English Q&A sourced from LiveGuideView's existing hardcoded questions
const ENGLISH_QA = {
  'humayun-tomb': [
    {
      q: "Why is it built of red sandstone?",
      a: "The red sandstone was sourced from Rajasthan, symbolizing imperial grandeur and power, contrasted with white marble representing spiritual purity.",
      keywords: ['red', 'sandstone', 'stone', 'built', 'why', 'material'],
    },
    {
      q: "Where is the main entrance?",
      a: "The main entrance is the West Gate where you entered. There is also a South Gate, which was traditionally reserved for the royal family.",
      keywords: ['entrance', 'gate', 'entry', 'where', 'door', 'main'],
    },
    {
      q: "Who is buried in the main chamber?",
      a: "The central chamber houses the cenotaph of Emperor Humayun. The surrounding chambers contain graves of his wives and later Mughal princes.",
      keywords: ['buried', 'tomb', 'grave', 'who', 'chamber', 'cenotaph'],
    },
    {
      q: "How does it connect to the Taj Mahal?",
      a: "It is the direct architectural prototype of the Taj Mahal. The double-dome and Charbagh gardens were scaled up 60 years later by Shah Jahan.",
      keywords: ['taj', 'mahal', 'connect', 'inspire', 'relation', 'similar'],
    },
  ],
  'red-fort': [
    {
      q: "What is the Diwan-i-Khas?",
      a: "The Hall of Private Audiences once housed the legendary Peacock Throne and is engraved with 'If there is a paradise on earth, it is this'.",
      keywords: ['diwan', 'khas', 'hall', 'private', 'peacock', 'throne'],
    },
    {
      q: "Why is it called Red Fort?",
      a: "Because of its massive red sandstone enclosing walls that stretch over 2.4 kilometers in Old Delhi.",
      keywords: ['red', 'fort', 'called', 'why', 'name', 'lal', 'qila'],
    },
    {
      q: "When was it built?",
      a: "Constructed by Mughal Emperor Shah Jahan between 1638 and 1648 when he moved his capital from Agra to Delhi.",
      keywords: ['when', 'built', 'year', 'construct', 'old', 'age', 'history'],
    },
  ],
};

/**
 * Match a spoken transcript to the best Q&A answer.
 *
 * @param {string} transcript - The user's spoken question text
 * @param {string} monumentId - ID of the current monument
 * @param {string} langCode   - Language code ('en', 'hi', 'ta', 'bn')
 * @returns {{ answer: string, confidence: number } | null}
 *
 * Future: Replace the body of this function with an LLM call:
 *   const result = await llm.chat({ context: qaData, question: transcript });
 *   return { answer: result.text, confidence: result.confidence };
 */
export function matchQuestion(transcript, monumentId, langCode = 'en') {
  if (!transcript || !transcript.trim()) return null;

  const normalizedInput = transcript.toLowerCase().trim();
  const inputWords = normalizedInput.split(/\s+/);

  // Get Q&A list for the language
  let qaList;
  if (langCode === 'en') {
    qaList = ENGLISH_QA[monumentId] || [];
  } else {
    const translated = getTranslatedQuestions(monumentId, langCode);
    qaList = translated || ENGLISH_QA[monumentId] || [];
  }

  if (qaList.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const qa of qaList) {
    const keywords = qa.keywords || [];
    let score = 0;

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (normalizedInput.includes(kw)) {
        score += kw.length > 3 ? 2 : 1; // Longer keywords get more weight
      }
    }

    // Also check if any word from the question appears in the input
    const qWords = qa.q.toLowerCase().split(/\s+/);
    for (const qw of qWords) {
      if (qw.length > 2 && inputWords.includes(qw)) {
        score += 0.5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  }

  // Minimum threshold: at least 2 keyword hits
  if (bestScore >= 2 && bestMatch) {
    return {
      answer: bestMatch.a,
      confidence: Math.min(bestScore / 6, 1),
    };
  }

  return null;
}

