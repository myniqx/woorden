export type ProviderType = 'gemini' | 'groq' | 'server';

export interface AIProvider {
  type: ProviderType;
  label: string;
  apiKey: string;
  createdAt: number;
  confirmedAt: number | null;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAdapter {
  stream(prompt: string): AsyncIterable<string>;
  chat(system: string, messages: AIChatMessage[]): AsyncIterable<string>;
}
