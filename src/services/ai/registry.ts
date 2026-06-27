import { GeminiAdapter } from './adapters/gemini';
import { GroqAdapter } from './adapters/groq';
import { ServerAdapter } from './adapters/server';
import { OllamaAdapter, LMStudioAdapter, OLLAMA_DEFAULT_URL, LMSTUDIO_DEFAULT_URL } from './adapters/local';
import type { AIAdapter, ProviderType } from './types';

export interface ProviderMeta {
  type: ProviderType;
  label: string;
  isLocal: boolean;
  defaultUrl: string | null;
  createAdapter: (apiKey: string, model?: string) => AIAdapter;
  getKeyGuide: ((language: string) => string) | null;
}

export const PROVIDER_REGISTRY: ProviderMeta[] = [
  {
    type: 'gemini',
    label: 'Google Gemini',
    isLocal: false,
    defaultUrl: null,
    createAdapter: (apiKey, model) => new GeminiAdapter(apiKey, model),
    getKeyGuide: (lang) => new GeminiAdapter('').getKeyGuide!(lang),
  },
  {
    type: 'groq',
    label: 'Groq',
    isLocal: false,
    defaultUrl: null,
    createAdapter: (apiKey, model) => new GroqAdapter(apiKey, model),
    getKeyGuide: (lang) => new GroqAdapter('').getKeyGuide!(lang),
  },
  {
    type: 'ollama',
    label: 'Ollama',
    isLocal: true,
    defaultUrl: OLLAMA_DEFAULT_URL,
    createAdapter: (apiKey, model) => new OllamaAdapter(apiKey, model),
    getKeyGuide: (lang) => new OllamaAdapter('').getKeyGuide!(lang),
  },
  {
    type: 'lmstudio',
    label: 'LM Studio',
    isLocal: true,
    defaultUrl: LMSTUDIO_DEFAULT_URL,
    createAdapter: (apiKey, model) => new LMStudioAdapter(apiKey, model),
    getKeyGuide: (lang) => new LMStudioAdapter('').getKeyGuide!(lang),
  },
  {
    type: 'server',
    label: 'Server',
    isLocal: false,
    defaultUrl: null,
    createAdapter: (apiKey) => new ServerAdapter(apiKey),
    getKeyGuide: null,
  },
];

export function getProviderMeta(type: ProviderType): ProviderMeta {
  const meta = PROVIDER_REGISTRY.find(p => p.type === type);
  if (!meta) throw new Error(`Unknown provider type: ${type}`);
  return meta;
}
