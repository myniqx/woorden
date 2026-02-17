import type { Word, WordWithArticle, WordEntry } from '../types';

import wordsData1 from '../data/a2-001.json';
import wordsData2 from '../data/a2-002.json';
import wordsData3 from '../data/a2-003.json';
import wordsData4 from '../data/a2-004.json';
import wordsData5 from '../data/a2-005.json';

const wordsData: WordEntry[] = [
  ...wordsData1,
  ...wordsData2,
  ...wordsData3,
  ...wordsData4,
  ...wordsData5,
] as WordEntry[];

export const words: Word[] = wordsData.map((word, index) => ({
  id: index,
  ...word,
  word: word.nl,
}));

export const wordsWithArticles: WordWithArticle[] = words.filter(
  (w): w is WordWithArticle => 'article' in w && (w.article === 'de' || w.article === 'het')
);

export const languages = [
  { code: 'tr' as const, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];
