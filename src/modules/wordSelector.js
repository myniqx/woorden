import { words, wordsWithArticles } from '../data/words.js';
import { getWordStats, getAllWordStats } from './storage.js';

// Calculate priority score for a word (higher = should show more)
function calculatePriority(wordId) {
  const stats = getWordStats(wordId);

  // Never seen words have highest priority
  if (stats.seen === 0) {
    return 100;
  }

  // Formula: wrong * 3 - correct + time factor
  const wrongWeight = stats.wrong * 3;
  const correctWeight = stats.correct;

  // Time factor: words not seen for a while get higher priority
  const timeSinceLastSeen = stats.lastSeen ? (Date.now() - stats.lastSeen) / (1000 * 60 * 60) : 24; // hours
  const timeFactor = Math.min(timeSinceLastSeen / 24, 5); // max 5 points for time

  return wrongWeight - correctWeight + timeFactor + 10; // base 10 so even mastered words can appear
}

// Get word pool based on quiz type
function getWordPool(quizType) {
  if (quizType === 'article') {
    return wordsWithArticles;
  }
  return words;
}

// Select a word using weighted random selection
// 20% from well-known words, 80% from others
export function selectWord(quizType = 'translation') {
  const pool = getWordPool(quizType);

  // Calculate priorities for all words
  const wordPriorities = pool.map(word => ({
    word,
    priority: calculatePriority(word.id)
  }));

  // Separate into well-known and others
  const wellKnown = wordPriorities.filter(wp => {
    const stats = getWordStats(wp.word.id);
    return stats.correct >= 3 && stats.wrong === 0;
  });

  const others = wordPriorities.filter(wp => {
    const stats = getWordStats(wp.word.id);
    return !(stats.correct >= 3 && stats.wrong === 0);
  });

  // Decide which pool to pick from (20% well-known, 80% others)
  let targetPool;
  if (others.length === 0) {
    targetPool = wellKnown;
  } else if (wellKnown.length === 0 || Math.random() > 0.2) {
    targetPool = others;
  } else {
    targetPool = wellKnown;
  }

  // Weighted random selection based on priority
  const totalPriority = targetPool.reduce((sum, wp) => sum + Math.max(wp.priority, 1), 0);
  let random = Math.random() * totalPriority;

  for (const wp of targetPool) {
    random -= Math.max(wp.priority, 1);
    if (random <= 0) {
      return wp.word;
    }
  }

  // Fallback to random selection
  return targetPool[Math.floor(Math.random() * targetPool.length)].word;
}

// Select wrong options for multiple choice (excluding correct answer)
export function selectWrongOptions(correctWord, count, quizType, language) {
  const pool = getWordPool(quizType);
  const options = [];
  const usedIds = new Set([correctWord.id]);

  // For translation quiz, we need words with different translations
  const correctTranslation = correctWord[language];

  while (options.length < count && usedIds.size < pool.length) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const candidate = pool[randomIndex];

    if (!usedIds.has(candidate.id) && candidate[language] !== correctTranslation) {
      options.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  return options;
}

// Generate quiz options (1 correct + 4 wrong, shuffled)
export function generateOptions(correctWord, quizType, language) {
  const wrongOptions = selectWrongOptions(correctWord, 4, quizType, language);
  const allOptions = [correctWord, ...wrongOptions];

  // Shuffle options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return allOptions;
}

// Get statistics summary
export function getStatsSummary() {
  const allStats = getAllWordStats();
  const totalWords = words.length;

  let seen = 0;
  let mastered = 0; // 3+ correct, 0 wrong
  let learning = 0; // seen but not mastered
  let difficult = 0; // more wrong than correct

  for (const wordId of Object.keys(allStats)) {
    const stats = allStats[wordId];
    if (stats.seen > 0) {
      seen++;
      if (stats.correct >= 3 && stats.wrong === 0) {
        mastered++;
      } else if (stats.wrong > stats.correct) {
        difficult++;
      } else {
        learning++;
      }
    }
  }

  return {
    totalWords,
    seen,
    unseen: totalWords - seen,
    mastered,
    learning,
    difficult
  };
}

export default {
  selectWord,
  selectWrongOptions,
  generateOptions,
  getStatsSummary
};
