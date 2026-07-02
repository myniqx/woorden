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

export type AIFinishReason = 'stop' | 'length' | 'unknown';

export interface AIStreamOptions {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  /** Called once when the stream completes normally; 'length' means the output was cut off. */
  onFinish?: (reason: AIFinishReason) => void;
}

export interface AIAdapter {
  preferredModel: string;
  getKeyGuide?: (language: string) => string;
  getModels(): Promise<string[]>;
  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string>;
  chat(system: string, messages: AIChatMessage[], options?: AIStreamOptions): AsyncIterable<string>;
}
