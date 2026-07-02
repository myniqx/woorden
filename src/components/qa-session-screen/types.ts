import type { AIErrorKind } from '../../services/ai';

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Short title generated alongside the answer to the session's first question. */
  title?: string;
  errorKind?: AIErrorKind;
  truncated?: boolean;
  pinned?: boolean;
}

export interface QASession {
  id: string;
  /** Set from the first answer's generated title once available; falls back to the question text until then. */
  title?: string;
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
