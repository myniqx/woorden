import type { AIErrorKind } from '../../services/ai';

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  errorKind?: AIErrorKind;
  truncated?: boolean;
  pinned?: boolean;
}

export interface QASession {
  id: string;
  providerId: string;
  messages: QAMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface QASettings {
  lastProviderId: string;
  lastModel?: string;
}

export interface QAPin {
  id: string;
  title: string;
  answer: string;
  createdAt: number;
}
