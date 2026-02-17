export type WordType =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'prep'
  | 'conj'
  | 'phrase'
  | 'num'
  | 'pron';

export type Article = 'de' | 'het';

export type Language = 'tr' | 'en' | 'ar' | 'fr';

export interface BaseWord {
  nl: string;
  type: WordType;
  tr: string;
  en: string;
  ar: string;
  fr: string;
}

export interface NounWord extends BaseWord {
  type: 'noun';
  article: Article;
  diminutive?: string;
}

export interface VerbWord extends BaseWord {
  type: 'verb';
  perfectum: string;
  imperfectum: string;
}

export interface OtherWord extends BaseWord {
  type: Exclude<WordType, 'noun' | 'verb'>;
}

export type WordEntry = NounWord | VerbWord | OtherWord;

export interface Word extends WordEntry {
  id: number;
  word: string; // alias for nl (backward compatibility)
}

export interface WordWithArticle extends Word {
  article: Article;
}

// Old format (for migration)
export interface WordStats {
  seen: number;
  correct: number;
  wrong: number;
  lastSeen: number | null;
}

export interface AllWordStats {
  [wordId: string]: WordStats;
}

// New format
export type HistoryEntry = 'c' | 'w';

export type SkillType = 'translationTo' | 'translationFrom' | 'article' | 'verbForms';

export interface SkillProgress {
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
  lastResult: 'correct' | 'wrong' | null;
  masteredAt: number | null;
  history: HistoryEntry[];
}

export interface WordProgress {
  firstSeen: number;
  lastSeen: number | null;
  skills: {
    translationTo?: SkillProgress;
    translationFrom?: SkillProgress;
    article?: SkillProgress;
    verbForms?: SkillProgress;
  };
}

export interface AllWordProgress {
  [wordNl: string]: WordProgress;
}
