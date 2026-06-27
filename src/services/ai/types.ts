export type ProviderType = 'gemini' | 'groq' | 'server' | 'ollama' | 'lmstudio';

export interface AIProvider {
  type: ProviderType;
  label: string;
  apiKey: string;
  model?: string;
  createdAt: number;
  confirmedAt: number | null;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAdapter {
  preferredModel: string;
  isLocal: boolean;
  getKeyGuide?: (language: string) => string;
  getModels(): Promise<string[]>;
  stream(prompt: string): AsyncIterable<string>;
  chat(system: string, messages: AIChatMessage[]): AsyncIterable<string>;
}
