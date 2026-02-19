import type { Language, WordStats, AllWordStats, WordProgress, AllWordProgress, SkillProgress, SkillType, HistoryEntry } from '../types';
import { words } from './words';

const STORAGE_KEY = 'woorden_app_data';
const MAX_HISTORY_LENGTH = 20;
const MASTERY_STREAK = 3;

interface DailyStats {
  practiced: number;
  correct: number;
}

// Hierarchical pack config: level -> chunk index -> enabled
// Example: { "A1": { "0": true, "1": false }, "A2": true }
export type EnabledPacks = Record<string, Record<string, boolean> | boolean>;

interface AppData {
  language: Language;
  wordStats?: AllWordStats; // Old format (kept for backup after migration)
  wordProgress: AllWordProgress; // New format
  dailyStats: Record<string, DailyStats>;
  streak: number;
  lastPracticeDate: string | null;
  bestDaily: number;
  enabledPacks: EnabledPacks; // Hierarchical word pack config
}

const defaultData: AppData = {
  language: 'tr',
  wordProgress: {},
  dailyStats: {},
  streak: 0,
  lastPracticeDate: null,
  bestDaily: 0,
  enabledPacks: {}, // empty = all enabled by default
};

// Migration helpers
function buildHistory(correct: number, wrong: number): HistoryEntry[] {
  const history: HistoryEntry[] = [
    ...Array(wrong).fill('w'),
    ...Array(correct).fill('c'),
  ];
  return history.slice(-MAX_HISTORY_LENGTH);
}

function determineLastResult(correct: number, wrong: number): 'correct' | 'wrong' | null {
  if (correct === 0 && wrong === 0) return null;
  return correct >= wrong ? 'correct' : 'wrong';
}

function calculateStreakFromHistory(history: HistoryEntry[]): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === 'c') streak++;
    else break;
  }
  return streak;
}

function createSkillFromOldStats(stats: WordStats): SkillProgress {
  const history = buildHistory(stats.correct, stats.wrong);
  const streak = calculateStreakFromHistory(history);
  const isMastered = streak >= MASTERY_STREAK && stats.wrong === 0;

  return {
    seen: stats.seen,
    correct: stats.correct,
    wrong: stats.wrong,
    streak,
    lastResult: determineLastResult(stats.correct, stats.wrong),
    masteredAt: isMastered ? (stats.lastSeen || Date.now()) : null,
    history,
  };
}

function migrateWordStats(oldStats: AllWordStats): AllWordProgress {
  const newProgress: AllWordProgress = {};
  const now = Date.now();

  for (const [id, stats] of Object.entries(oldStats)) {
    const word = words.find(w => w.id === Number(id));
    if (word) {
      const skillProgress = createSkillFromOldStats(stats);

      newProgress[word.nl] = {
        firstSeen: stats.lastSeen || now,
        lastSeen: stats.lastSeen,
        skills: {
          translationTo: { ...skillProgress },
          translationFrom: { ...skillProgress },
        },
      };
    }
  }

  return newProgress;
}

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Check if migration is needed (wordStats exists but no wordProgress)
      if (parsed.wordStats && !parsed.wordProgress) {
        console.log('Migrating wordStats to wordProgress...');
        const migratedProgress = migrateWordStats(parsed.wordStats);
        const migrated: AppData = {
          ...defaultData,
          ...parsed,
          wordProgress: migratedProgress,
        };
        saveData(migrated);
        console.log(`Migration complete: ${Object.keys(migratedProgress).length} words migrated`);
        return migrated;
      }

      // Check if we have old wordProgress format (without skills) - ignore it and re-migrate
      if (parsed.wordProgress) {
        const firstKey = Object.keys(parsed.wordProgress)[0];
        if (firstKey && !parsed.wordProgress[firstKey].skills) {
          console.log('Old wordProgress format detected, re-migrating from wordStats...');
          if (parsed.wordStats) {
            const migratedProgress = migrateWordStats(parsed.wordStats);
            const migrated: AppData = {
              ...defaultData,
              ...parsed,
              wordProgress: migratedProgress,
            };
            saveData(migrated);
            console.log(`Re-migration complete: ${Object.keys(migratedProgress).length} words migrated`);
            return migrated;
          }
        }
      }

      return { ...defaultData, ...parsed };
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return { ...defaultData };
}

function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

let appData = loadData();

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function updateDailyStats(isCorrect: boolean): void {
  const today = getTodayKey();

  if (!appData.dailyStats[today]) {
    appData.dailyStats[today] = { practiced: 0, correct: 0 };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    if (appData.lastPracticeDate === yesterdayKey) {
      appData.streak++;
    } else if (appData.lastPracticeDate !== today) {
      appData.streak = 1;
    }

    appData.lastPracticeDate = today;
  }

  appData.dailyStats[today].practiced++;
  if (isCorrect) {
    appData.dailyStats[today].correct++;
  }

  if (appData.dailyStats[today].practiced > appData.bestDaily) {
    appData.bestDaily = appData.dailyStats[today].practiced;
  }
}

function createDefaultSkillProgress(): SkillProgress {
  return {
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    lastResult: null,
    masteredAt: null,
    history: [],
  };
}

function createDefaultWordProgress(): WordProgress {
  return {
    firstSeen: Date.now(),
    lastSeen: null,
    skills: {},
  };
}

export function getWordProgress(wordNl: string): WordProgress {
  return appData.wordProgress[wordNl] || createDefaultWordProgress();
}

export function getSkillProgress(wordNl: string, skill: SkillType): SkillProgress {
  const wordProgress = getWordProgress(wordNl);
  return wordProgress.skills[skill] || createDefaultSkillProgress();
}

export function updateWordProgress(wordNl: string, skill: SkillType, isCorrect: boolean): void {
  const now = Date.now();

  // Get or create word progress
  if (!appData.wordProgress[wordNl]) {
    appData.wordProgress[wordNl] = createDefaultWordProgress();
  }
  const wordProgress = appData.wordProgress[wordNl];

  // Update word-level timestamps
  if (!wordProgress.firstSeen) {
    wordProgress.firstSeen = now;
  }
  wordProgress.lastSeen = now;

  // Get or create skill progress
  if (!wordProgress.skills[skill]) {
    wordProgress.skills[skill] = createDefaultSkillProgress();
  }
  const skillProgress = wordProgress.skills[skill]!;

  // Update skill stats
  skillProgress.seen++;
  if (isCorrect) {
    skillProgress.correct++;
    skillProgress.streak++;
  } else {
    skillProgress.wrong++;
    skillProgress.streak = 0;
  }
  skillProgress.lastResult = isCorrect ? 'correct' : 'wrong';

  // Update history
  skillProgress.history.push(isCorrect ? 'c' : 'w');
  if (skillProgress.history.length > MAX_HISTORY_LENGTH) {
    skillProgress.history = skillProgress.history.slice(-MAX_HISTORY_LENGTH);
  }

  // Check mastery
  if (!skillProgress.masteredAt && skillProgress.streak >= MASTERY_STREAK && skillProgress.wrong === 0) {
    skillProgress.masteredAt = now;
  }

  updateDailyStats(isCorrect);
  saveData(appData);
}

// Map quiz types to skill types
const quizTypeToSkill: Record<string, SkillType> = {
  nativeToDutch: 'translationTo',
  dutchToNative: 'translationFrom',
  article: 'article',
  verbForms: 'verbForms',
};

export function getSkillForQuizType(quizType: string): SkillType {
  return quizTypeToSkill[quizType] || 'translationTo';
}

// Legacy function for backward compatibility
export function getWordStats(wordId: number): WordStats {
  const word = words.find(w => w.id === wordId);
  if (!word) {
    return { seen: 0, correct: 0, wrong: 0, lastSeen: null };
  }

  // Aggregate all skills for this word
  const wordProgress = getWordProgress(word.nl);
  let totalSeen = 0, totalCorrect = 0, totalWrong = 0;
  let lastSeen: number | null = null;

  for (const skill of Object.values(wordProgress.skills)) {
    if (skill) {
      totalSeen += skill.seen;
      totalCorrect += skill.correct;
      totalWrong += skill.wrong;
    }
  }

  return {
    seen: totalSeen,
    correct: totalCorrect,
    wrong: totalWrong,
    lastSeen: wordProgress.lastSeen,
  };
}

// Legacy function for backward compatibility (defaults to translationTo)
export function updateWordStats(wordId: number, isCorrect: boolean): void {
  const word = words.find(w => w.id === wordId);
  if (word) {
    updateWordProgress(word.nl, 'translationTo', isCorrect);
  }
}

export function getDailyStats(): DailyStats {
  const today = getTodayKey();
  return appData.dailyStats[today] || { practiced: 0, correct: 0 };
}

export function getStreak(): number {
  return appData.streak;
}

export function getDailyGoal(): number {
  return Math.max(100, appData.bestDaily);
}

export function getBestDaily(): number {
  return appData.bestDaily;
}

// Get stats for a specific skill across all words
export function getSkillStats(skill: SkillType): {
  total: number;
  seen: number;
  unseen: number;
  learning: number;
  mastered: number;
  difficult: number
} {
  let total = 0;
  let seen = 0;
  let mastered = 0;
  let learning = 0;
  let difficult = 0;

  // Filter words that can have this skill
  const relevantWords = words.filter(word => {
    if (skill === 'article') return word.type === 'noun';
    if (skill === 'verbForms') return word.type === 'verb';
    return true; // translation skills apply to all
  });

  total = relevantWords.length;

  for (const word of relevantWords) {
    const skillProgress = appData.wordProgress[word.nl]?.skills[skill];
    if (skillProgress && skillProgress.seen > 0) {
      seen++;
      if (skillProgress.masteredAt) {
        mastered++;
      } else if (skillProgress.wrong > skillProgress.correct) {
        difficult++;
      } else {
        learning++;
      }
    }
  }

  return {
    total,
    seen,
    unseen: total - seen,
    learning,
    mastered,
    difficult,
  };
}

// Get overall stats (any skill seen = word seen)
export function getOverallStats(): {
  total: number;
  seen: number;
  unseen: number;
  learning: number;
  mastered: number;
  difficult: number
} {
  const total = words.length;
  let seen = 0;
  let mastered = 0;
  let learning = 0;
  let difficult = 0;

  for (const word of words) {
    const wordProgress = appData.wordProgress[word.nl];
    if (wordProgress) {
      let wordSeen = false;
      let wordMastered = true;
      let wordDifficult = false;
      let hasAnySkill = false;

      for (const skill of Object.values(wordProgress.skills)) {
        if (skill && skill.seen > 0) {
          hasAnySkill = true;
          wordSeen = true;
          if (!skill.masteredAt) {
            wordMastered = false;
          }
          if (skill.wrong > skill.correct) {
            wordDifficult = true;
          }
        }
      }

      if (wordSeen) {
        seen++;
        if (hasAnySkill && wordMastered) {
          mastered++;
        } else if (wordDifficult) {
          difficult++;
        } else {
          learning++;
        }
      }
    }
  }

  return {
    total,
    seen,
    unseen: total - seen,
    learning,
    mastered,
    difficult,
  };
}

export function getAllWordStats(): AllWordStats {
  const oldFormat: AllWordStats = {};
  for (const word of words) {
    const stats = getWordStats(word.id);
    if (stats.seen > 0) {
      oldFormat[word.id] = stats;
    }
  }
  return oldFormat;
}

export function getAllWordProgress(): AllWordProgress {
  return appData.wordProgress;
}

export function resetData(): void {
  appData = { ...defaultData };
  saveData(appData);
}

// Export data (without wordStats - old format)
export function exportData(): string {
  const exportObj = {
    language: appData.language,
    wordProgress: appData.wordProgress,
    dailyStats: appData.dailyStats,
    streak: appData.streak,
    lastPracticeDate: appData.lastPracticeDate,
    bestDaily: appData.bestDaily,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportObj, null, 2);
}

// Import data
export function importData(jsonString: string): { success: boolean; message: string } {
  try {
    const imported = JSON.parse(jsonString);

    // Validate required fields
    if (!imported.wordProgress || typeof imported.wordProgress !== 'object') {
      return { success: false, message: 'Invalid data format: missing wordProgress' };
    }

    // Merge with current data
    appData = {
      ...defaultData,
      language: imported.language || appData.language,
      wordProgress: imported.wordProgress,
      dailyStats: imported.dailyStats || {},
      streak: imported.streak || 0,
      lastPracticeDate: imported.lastPracticeDate || null,
      bestDaily: imported.bestDaily || 0,
    };

    saveData(appData);
    return { success: true, message: `Imported ${Object.keys(imported.wordProgress).length} words` };
  } catch (e) {
    return { success: false, message: 'Invalid JSON format' };
  }
}

// Word pack management - hierarchical structure
export function getEnabledPacks(): EnabledPacks {
  return appData.enabledPacks;
}

// Check if a level is enabled (any chunk enabled = level enabled)
export function isLevelEnabled(level: string): boolean {
  const levelConfig = appData.enabledPacks[level];

  // undefined or true = all chunks enabled
  if (levelConfig === undefined || levelConfig === true) {
    return true;
  }

  // false = all chunks disabled
  if (levelConfig === false) {
    return false;
  }

  // Object = check if any chunk is enabled
  if (typeof levelConfig === 'object') {
    return Object.values(levelConfig).some(v => v !== false);
  }

  return true;
}

// Check if a specific chunk is enabled
export function isChunkEnabled(level: string, chunkIndex: number): boolean {
  const levelConfig = appData.enabledPacks[level];

  // undefined or true = all chunks enabled
  if (levelConfig === undefined || levelConfig === true) {
    return true;
  }

  // false = all chunks disabled
  if (levelConfig === false) {
    return false;
  }

  // Object = check specific chunk
  if (typeof levelConfig === 'object') {
    return levelConfig[chunkIndex] !== false;
  }

  return true;
}

// Set a specific chunk's enabled state
export function setChunkEnabled(level: string, chunkIndex: number, enabled: boolean): void {
  let levelConfig = appData.enabledPacks[level];

  // Convert to object if needed
  if (typeof levelConfig !== 'object') {
    levelConfig = {};
    appData.enabledPacks[level] = levelConfig;
  }

  levelConfig[chunkIndex] = enabled;
  saveData(appData);
}

// Toggle a specific chunk
export function toggleChunk(level: string, chunkIndex: number): boolean {
  const newState = !isChunkEnabled(level, chunkIndex);
  setChunkEnabled(level, chunkIndex, newState);
  return newState;
}

// Set entire level enabled/disabled
export function setLevelEnabled(level: string, enabled: boolean): void {
  if (enabled) {
    // Enable all = remove config (default is enabled)
    delete appData.enabledPacks[level];
  } else {
    // Disable all = set to false
    appData.enabledPacks[level] = false;
  }
  saveData(appData);
}

// Toggle entire level
export function toggleLevel(level: string): boolean {
  const newState = !isLevelEnabled(level);
  setLevelEnabled(level, newState);
  return newState;
}

// Check if all chunks in a level are enabled
export function areAllChunksEnabled(level: string, chunkCount: number): boolean {
  for (let i = 0; i < chunkCount; i++) {
    if (!isChunkEnabled(level, i)) {
      return false;
    }
  }
  return true;
}

// Check if no chunks in a level are enabled
export function areNoChunksEnabled(level: string, chunkCount: number): boolean {
  for (let i = 0; i < chunkCount; i++) {
    if (isChunkEnabled(level, i)) {
      return false;
    }
  }
  return true;
}
