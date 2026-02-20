import type { Word, Language } from './word';

export type QuizType = 'nativeToDutch' | 'dutchToNative' | 'article' | 'nativeToDutch_write' | 'verbForms';

// Quiz mode: normal uses all enabled words, pinned uses only pinned words
export type QuizMode = 'normal' | 'pinned';

export type Screen = 'menu' | 'quiz';

export interface QuizOption {
  id: string | number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  text: string;
  subtext?: string;
  fullText?: string;
}

export interface Quiz {
  type: QuizType;
  word: Word;
  question: QuizQuestion;
  options: QuizOption[];
  correctAnswer: string | number;
  answered: boolean;
  selectedAnswer: string | number | null;
  isCorrect: boolean | null;
}

export interface QuizResult {
  isCorrect: boolean;
  correctAnswer: string | number;
  word: Word;
}

export interface QuizTypeInfo {
  name: string;
  icon: string;
  description: string;
}

export interface AppState {
  screen: Screen;
  currentQuizType: QuizType | null;
  language: Language;
  theme: 'light' | 'dark';
}
