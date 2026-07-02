import type { CEFRLevel } from '../ai-chat-screen/types';

export interface WritingAssignment {
  topic: string;
  format: string;
  scenario: string;
  minWords: number;
  register: 'formal' | 'informal';
  requirements: string[];
}

export interface WritingCorrection {
  quote: string;
  correction: string;
  explanation: string;
}

export interface WritingVocabularyItem {
  word: string;
  translation: string;
}

export interface WritingScores {
  grammar: number;
  spelling: number;
  vocabulary: number;
  overall: number;
}

export interface WritingAnalysis {
  grammar: string;
  sentenceStructure: string;
  wordChoice: string;
}

export interface WritingReview {
  overallComment: string;
  analysis: WritingAnalysis;
  corrections: WritingCorrection[];
  scores: WritingScores;
  estimatedLevel: string;
  improvementTip: string;
  vocabulary: WritingVocabularyItem[];
}

export interface WritingEntry {
  id: string;
  level: CEFRLevel;
  assignment: WritingAssignment;
  userText: string;
  review: WritingReview;
  createdAt: number;
}

export interface WritingSettings {
  lastLevel: CEFRLevel;
  lastProviderId: string;
  lastModel?: string;
}

export type WritingPhase = 'setup' | 'assignment' | 'reviewing' | 'result' | 'viewing';

export interface WritingDraft {
  assignment: WritingAssignment;
  text: string;
}
