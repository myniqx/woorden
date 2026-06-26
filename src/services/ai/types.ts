export type ProviderType = 'gemini' | 'groq' | 'server';

export interface AIProvider {
  type: ProviderType;
  label: string;
  apiKey: string;
  createdAt: number;
  confirmedAt: number | null;
}

export interface AIAdapter {
  stream(prompt: string): AsyncIterable<string>;
}
