export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface ReviewResult {
  status: 'pending' | 'done' | 'error';
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  review?: ReviewResult;
}

export interface ChatSession {
  id: string;
  level: CEFRLevel;
  topic: string;
  providerId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  lastLevel: CEFRLevel;
  lastProviderId: string;
}
