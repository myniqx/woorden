import { words, wordsWithArticles } from '../data/words.js';
import { getWordStats, getAllWordStats } from './storage.js';

// Calculate priority score for a word (higher = should show more)
function calculatePriority(wordId) {
  const stats = getWordStats(wordId);

  // Never seen words have highest priority
  if (stats.seen === 0) {
    return 100;
  }

  // Time factor: words not seen for a while get higher priority
  const timeSinceLastSeen = stats.lastSeen ? (Date.now() - stats.lastSeen) / (1000 * 60 * 60) : 24; // hours
  const hoursSinceLastSeen = Math.min(timeSinceLastSeen, 168); // cap at 1 week

  // Calculate mastery level (0 to 1, where 1 is fully mastered)
  const totalAnswers = stats.correct + stats.wrong;
  const correctRatio = totalAnswers > 0 ? stats.correct / totalAnswers : 0;
  const masteryLevel = Math.min(stats.correct / 5, 1) * correctRatio; // need 5 correct with good ratio

  // Priority formula:
  // - Wrong answers increase priority significantly
  // - Correct answers decrease priority
  // - Time since last seen increases priority
  // - Lower mastery = higher priority
  const wrongBonus = stats.wrong * 15;
  const correctPenalty = stats.correct * 3;
  const timeFactor = hoursSinceLastSeen / 6; // more weight to time
  const masteryPenalty = masteryLevel * 20;

  // Final priority (minimum 1 to always have some chance)
  return Math.max(1, wrongBonus - correctPenalty + timeFactor - masteryPenalty + 20);
}

// Get word pool based on quiz type
function getWordPool(quizType) {
  if (quizType === 'article') {
    return wordsWithArticles;
  }
  return words;
}

// Select a word using weighted random selection based on priority
export function selectWord(quizType = 'translation') {
  const pool = getWordPool(quizType);

  // Calculate priorities for all words
  const wordPriorities = pool.map(word => ({
    word,
    priority: calculatePriority(word.id)
  }));

  // Weighted random selection - higher priority = higher chance
  const totalPriority = wordPriorities.reduce((sum, wp) => sum + wp.priority, 0);
  let random = Math.random() * totalPriority;

  for (const wp of wordPriorities) {
    random -= wp.priority;
    if (random <= 0) {
      return wp.word;
    }
  }

  // Fallback to random selection
  return pool[Math.floor(Math.random() * pool.length)];
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
