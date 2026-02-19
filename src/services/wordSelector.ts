import type { Word, WordWithArticle, WordEntry, Language, SkillType } from '../types';
import { words, wordsWithArticles, getLevelWords, getWordLevel } from './words';
import { getSkillProgress, getOverallStats, getSkillStats, getSkillForQuizType } from './storage';

function calculatePriority(word: Word, skill: SkillType): number {
  const progress = getSkillProgress(word.nl, skill);

  if (progress.seen === 0) {
    return 100;
  }

  let score = 99;
  if (progress.lastResult !== 'wrong') {
    score -= 50;
  } else {
    score -= 10;
  }

  const timeSinceLastSeen = progress.history.length > 0
    ? (Date.now() - (progress.masteredAt || Date.now())) / (1000 * 60 * 60)
    : 0;
  const timeFactor = Math.log2(timeSinceLastSeen + 1) * 3;

  score += timeFactor;

  return Math.min(99, Math.max(0, score));
}

function getWordPool(quizType: string): Word[] {
  if (quizType === 'article') {
    return wordsWithArticles;
  }
  if (quizType === 'verbForms') {
    return words.filter(w => w.type === 'verb');
  }
  return words;
}

export function selectWord(quizType: string = 'translation'): Word {
  const pool = getWordPool(quizType);
  const skill = getSkillForQuizType(quizType);

  const wordPriorities = pool.map((word) => ({
    word,
    priority: calculatePriority(word, skill),
  }));

  const totalPriority = wordPriorities.reduce((sum, wp) => sum + wp.priority, 0);
  let random = Math.random() * totalPriority;

  for (const wp of wordPriorities) {
    random -= wp.priority;
    if (random <= 0) {
      return wp.word;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function selectWrongOptions(
  correctWord: Word,
  count: number,
  quizType: string,
  language: Language
): Word[] {
  const options: Word[] = [];
  const usedNls = new Set<string>([correctWord.nl]);
  const correctTranslation = correctWord[language];
  const correctType = correctWord.type;

  // Get the level this word belongs to
  const wordLevel = getWordLevel(correctWord.nl);

  // Get all words from the same level for filtering
  const levelWords = wordLevel ? getLevelWords(wordLevel) : [];

  // First try: same type from same level
  const sameTypeSameLevel = levelWords.filter(
    w => w.type === correctType && w.nl !== correctWord.nl && w[language] !== correctTranslation
  );

  // Shuffle and pick from same type same level
  const shuffledSameType = [...sameTypeSameLevel].sort(() => Math.random() - 0.5);

  for (const candidate of shuffledSameType) {
    if (options.length >= count) break;
    if (!usedNls.has(candidate.nl)) {
      options.push({ ...candidate, id: options.length + 1000, word: candidate.nl } as Word);
      usedNls.add(candidate.nl);
    }
  }

  // If not enough, get same type from all enabled words
  if (options.length < count) {
    const pool = getWordPool(quizType);
    const sameTypeAll = pool.filter(
      w => w.type === correctType && !usedNls.has(w.nl) && w[language] !== correctTranslation
    );
    const shuffledAll = [...sameTypeAll].sort(() => Math.random() - 0.5);

    for (const candidate of shuffledAll) {
      if (options.length >= count) break;
      if (!usedNls.has(candidate.nl)) {
        options.push(candidate);
        usedNls.add(candidate.nl);
      }
    }
  }

  // If still not enough, fall back to any word from level
  if (options.length < count) {
    const anyFromLevel = levelWords.filter(
      w => !usedNls.has(w.nl) && w[language] !== correctTranslation
    );
    const shuffledAny = [...anyFromLevel].sort(() => Math.random() - 0.5);

    for (const candidate of shuffledAny) {
      if (options.length >= count) break;
      if (!usedNls.has(candidate.nl)) {
        options.push({ ...candidate, id: options.length + 2000, word: candidate.nl } as Word);
        usedNls.add(candidate.nl);
      }
    }
  }

  // Last resort: any enabled word
  if (options.length < count) {
    const pool = getWordPool(quizType);
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    for (const candidate of shuffledPool) {
      if (options.length >= count) break;
      if (!usedNls.has(candidate.nl) && candidate[language] !== correctTranslation) {
        options.push(candidate);
        usedNls.add(candidate.nl);
      }
    }
  }

  return options;
}

export function generateOptions(
  correctWord: Word,
  quizType: string,
  language: Language
): Word[] {
  const wrongOptions = selectWrongOptions(correctWord, 4, quizType, language);
  const allOptions = [correctWord, ...wrongOptions];

  // Shuffle
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return allOptions;
}

export interface StatsSummary {
  total: number;
  seen: number;
  unseen: number;
  mastered: number;
  learning: number;
  difficult: number;
}

export function getStatsSummary(quizType?: string): StatsSummary {
  if (quizType) {
    const skill = getSkillForQuizType(quizType);
    const stats = getSkillStats(skill);
    return {
      total: stats.total,
      seen: stats.seen,
      unseen: stats.unseen,
      mastered: stats.mastered,
      learning: stats.learning,
      difficult: stats.difficult,
    };
  }

  // Overall stats
  const stats = getOverallStats();
  return {
    total: stats.total,
    seen: stats.seen,
    unseen: stats.unseen,
    mastered: stats.mastered,
    learning: stats.learning,
    difficult: stats.difficult,
  };
}
