import type { Word, WordWithArticle, WordEntry } from '../types';

const STORAGE_KEY = 'woorden_app_data';

// Helper to split array into chunks of given size
function splitChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Read enabled packs directly from localStorage to avoid circular dependency
function getEnabledPacksFromStorage(): Record<string, Record<string, boolean> | boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.enabledPacks || {};
    }
  } catch (e) {
    console.error('Error reading enabled packs:', e);
  }
  return {};
}

// A1 level words
import a1Data1 from '../data/a1-001.json';
import a1Data2 from '../data/a1-002.json';
import a1Data3 from '../data/a1-003.json';
import a1Data4 from '../data/a1-004.json';
import a1Data5 from '../data/a1-005.json';
import a1Data6 from '../data/a1-006.json';
import a1Data7 from '../data/a1-007.json';
import a1Data8 from '../data/a1-008.json';
import a1Data9 from '../data/a1-009.json';
import a1Data10 from '../data/a1-010.json';

// A2 level words
import a2Data1 from '../data/a2-001.json';
import a2Data2 from '../data/a2-002.json';
import a2Data3 from '../data/a2-003.json';
import a2Data4 from '../data/a2-004.json';
import a2Data5 from '../data/a2-005.json';

// Keep a1 words in chunks
const a1Chunks: WordEntry[][] = [
  a1Data1,
  a1Data2,
  a1Data3,
  a1Data4,
  a1Data5,
  a1Data6,
  a1Data7,
  a1Data8,
  a1Data9,
  a1Data10,
] as WordEntry[][];

// Combine all A2 words and split into ~100 word chunks
const allA2Words: WordEntry[] = [
  ...a2Data1,
  ...a2Data2,
  ...a2Data3,
  ...a2Data4,
  ...a2Data5,
] as WordEntry[];

const a2Chunks = splitChunks(allA2Words, 100);

// Word pack structure: level -> subpacks
export interface WordPackLevel {
  chunks: WordEntry[][];
}

export const wordPackLevels: Record<string, WordPackLevel> = {
  A1: { chunks: a1Chunks },
  A2: { chunks: a2Chunks },
};

// Get all available level names
export function getAvailableLevels(): string[] {
  return Object.keys(wordPackLevels);
}

// Get chunk count for a level
export function getChunkCount(level: string): number {
  return wordPackLevels[level]?.chunks.length || 0;
}

// Get word count for a specific chunk
export function getChunkWordCount(level: string, chunkIndex: number): number {
  return wordPackLevels[level]?.chunks[chunkIndex]?.length || 0;
}

// Get total word count for a level
export function getLevelWordCount(level: string): number {
  const levelData = wordPackLevels[level];
  if (!levelData) return 0;
  return levelData.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
}

// Check if a level is enabled (any chunk enabled = level enabled)
export function isLevelEnabled(level: string): boolean {
  const enabledPacks = getEnabledPacksFromStorage();
  const levelConfig = enabledPacks[level];

  // If level config doesn't exist or is true, all chunks are enabled
  if (levelConfig === undefined || levelConfig === true) {
    return true;
  }

  // If level config is false, level is disabled
  if (levelConfig === false) {
    return false;
  }

  // If level config is an object, check if any chunk is enabled
  if (typeof levelConfig === 'object') {
    const chunkCount = getChunkCount(level);
    for (let i = 0; i < chunkCount; i++) {
      if (levelConfig[i] !== false) {
        return true;
      }
    }
    return false;
  }

  return true;
}

// Check if a specific chunk is enabled
export function isChunkEnabled(level: string, chunkIndex: number): boolean {
  const enabledPacks = getEnabledPacksFromStorage();
  const levelConfig = enabledPacks[level];

  // If level config doesn't exist or is true, all chunks are enabled
  if (levelConfig === undefined || levelConfig === true) {
    return true;
  }

  // If level config is false, all chunks are disabled
  if (levelConfig === false) {
    return false;
  }

  // If level config is an object, check specific chunk
  if (typeof levelConfig === 'object') {
    return levelConfig[chunkIndex] !== false;
  }

  return true;
}

// Get total selected word count across all enabled packs
export function getSelectedWordCount(): number {
  let count = 0;
  for (const level of getAvailableLevels()) {
    const chunkCount = getChunkCount(level);
    for (let i = 0; i < chunkCount; i++) {
      if (isChunkEnabled(level, i)) {
        count += getChunkWordCount(level, i);
      }
    }
  }
  return count;
}

// Get words from enabled packs only
function getEnabledWords(): WordEntry[] {
  const enabledWords: WordEntry[] = [];

  for (const level of getAvailableLevels()) {
    const levelData = wordPackLevels[level];
    if (!levelData) continue;

    for (let i = 0; i < levelData.chunks.length; i++) {
      if (isChunkEnabled(level, i)) {
        enabledWords.push(...levelData.chunks[i]);
      }
    }
  }

  return enabledWords;
}

// Build words array from enabled packs
function buildWords(): Word[] {
  return getEnabledWords().map((word, index) => ({
    id: index,
    ...word,
    word: word.nl,
  }));
}

// Mutable words array that gets rebuilt when packs change
export let words: Word[] = buildWords();

// Rebuild words when packs change
export function refreshWords(): void {
  words = buildWords();
}

// Get words with articles (for article quiz)
export function getWordsWithArticles(): WordWithArticle[] {
  return words.filter(
    (w): w is WordWithArticle => 'article' in w && (w.article === 'de' || w.article === 'het')
  );
}

// Legacy export for backward compatibility
export const wordsWithArticles: WordWithArticle[] = getWordsWithArticles();

// Get all words from a specific level (for wrong options pool)
export function getLevelWords(level: string): WordEntry[] {
  const levelData = wordPackLevels[level];
  if (!levelData) return [];
  return levelData.chunks.flat();
}

// Find which level a word belongs to
export function getWordLevel(wordNl: string): string | null {
  for (const level of getAvailableLevels()) {
    const levelWords = getLevelWords(level);
    if (levelWords.some(w => w.nl === wordNl)) {
      return level;
    }
  }
  return null;
}

export const languages = [
  { code: 'tr' as const, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];
