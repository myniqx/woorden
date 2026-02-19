import type { Word, WordWithArticle, WordEntry } from '../types';

const STORAGE_KEY = 'woorden_app_data';

// Read enabled packs directly from localStorage to avoid circular dependency
function getEnabledPacksFromStorage(): Record<string, boolean> {
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

// Word packs by level
export const wordPacks: Record<string, WordEntry[]> = {
  A1: [
    ...a1Data1,
    ...a1Data2,
    ...a1Data3,
    ...a1Data4,
    ...a1Data5,
    ...a1Data6,
    ...a1Data7,
    ...a1Data8,
    ...a1Data9,
    ...a1Data10,
  ] as WordEntry[],
  A2: [
    ...a2Data1,
    ...a2Data2,
    ...a2Data3,
    ...a2Data4,
    ...a2Data5,
  ] as WordEntry[],
};

// Get all available pack names
export function getAvailablePacks(): string[] {
  return Object.keys(wordPacks);
}

// Get words from enabled packs only
function getEnabledWords(): WordEntry[] {
  const enabledPacks = getEnabledPacksFromStorage();
  const enabledWords: WordEntry[] = [];

  for (const [packName, packWords] of Object.entries(wordPacks)) {
    // undefined or true = enabled
    if (enabledPacks[packName] !== false) {
      enabledWords.push(...packWords);
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

export const languages = [
  { code: 'tr' as const, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];
