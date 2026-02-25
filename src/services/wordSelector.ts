import type { Word, Language, SkillType, QuizMode } from '../types';
import { words, wordsWithArticles, getLevelWords, getWordLevel } from './words';
import { getSkillProgress, getWordProgress, getOverallStats, getSkillStats, getSkillForQuizType, getPinnedWords } from './storage';

const RECENT_THRESHOLD_MS = 60 * 1000; // 1 minute

interface WordScore {
  word: Word;
  group: 0 | 1 | 2; // 0=unseen, 1=wrong, 2=correct
  seen: number;
  wrongCount: number;
  correctCount: number;
  recentlySeen: boolean;
}

function buildWordScore(word: Word, skill: SkillType): WordScore {
  const progress = getSkillProgress(word.nl, skill);
  const wordProgress = getWordProgress(word.nl);
  const recentlySeen = wordProgress.lastSeen !== null && (Date.now() - wordProgress.lastSeen) < RECENT_THRESHOLD_MS;

  if (progress.seen === 0) {
    return { word, group: 0, seen: 0, wrongCount: 0, correctCount: 0, recentlySeen };
  }

  const wrongCount = progress.history.filter(h => h === 'w').length;
  const correctCount = progress.history.filter(h => h === 'c').length;
  const group = progress.lastResult === 'wrong' ? 1 : 2;

  return { word, group, seen: progress.seen, wrongCount, correctCount, recentlySeen };
}

function compareScores(a: WordScore, b: WordScore): number {
  // Recently seen words go last
  if (a.recentlySeen !== b.recentlySeen) return a.recentlySeen ? 1 : -1;

  // Group order: 0 (unseen) > 1 (wrong) > 2 (correct)
  if (a.group !== b.group) return a.group - b.group;

  // Within same group: fewer seen first
  if (a.seen !== b.seen) return a.seen - b.seen;

  if (a.group === 1) {
    // Wrong group: more wrong first
    return b.wrongCount - a.wrongCount;
  } else {
    // Correct group: fewer correct first (least mastered first)
    return a.correctCount - b.correctCount;
  }
}

function getWordPool(quizType: string): Word[] {
  if (quizType === 'article') {
    return wordsWithArticles;
  }
  if (quizType === 'verbForms') {
    return words.filter(w => w.type === 'verb' && 'perfectum' in w && 'imperfectum' in w);
  }
  // nativeToDutch, dutchToNative, nativeToDutch_write, translation all use full word list
  return words;
}

export function selectWord(quizType: string = 'translation', mode: QuizMode = 'normal'): Word {
  let pool = getWordPool(quizType);
  const skill = getSkillForQuizType(quizType);

  // If pinned mode, filter to only pinned words that are in the active pool
  if (mode === 'pinned') {
    const pinnedNls = getPinnedWords(quizType);
    pool = pool.filter(w => pinnedNls.includes(w.nl));
  }

  const scores = pool.map(word => buildWordScore(word, skill));

  // Sort by priority, shuffle among truly equal candidates
  scores.sort((a, b) => {
    const cmp = compareScores(a, b);
    if (cmp !== 0) return cmp;
    return Math.random() - 0.5;
  });

  return scores[0].word;
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
