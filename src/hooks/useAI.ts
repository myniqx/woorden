import { useState, useCallback } from 'preact/hooks';
import {
  getProviders,
  getActiveProviderType,
  setActiveProviderType,
  streamObject,
  GeminiAdapter,
  GroqAdapter,
  ServerAdapter,
  OllamaAdapter,
  LMStudioAdapter,
} from '../services/ai';
import type { AIProvider, AIAdapter, ProviderType } from '../services/ai';

function createAdapter(provider: AIProvider): AIAdapter {
  switch (provider.type) {
    case 'gemini':   return new GeminiAdapter(provider.apiKey, provider.model);
    case 'groq':     return new GroqAdapter(provider.apiKey, provider.model);
    case 'server':   return new ServerAdapter(provider.apiKey);
    case 'ollama':   return new OllamaAdapter(provider.apiKey, provider.model);
    case 'lmstudio': return new LMStudioAdapter(provider.apiKey, provider.model);
  }
}

interface UseAIResult<T> {
  submit: (prompt: string) => Promise<void>;
  result: Partial<T> | null;
  isStreaming: boolean;
  doneStreaming: boolean;
  error: string | null;
  currentProvider: ProviderType | null;
  providerList: AIProvider[];
  setProvider: (type: ProviderType) => void;
}

export function useAI<T>(): UseAIResult<T> {
  const [result, setResult] = useState<Partial<T> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [doneStreaming, setDoneStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<ProviderType | null>(
    getActiveProviderType,
  );

  const providerList = getProviders();

  const setProvider = useCallback((type: ProviderType) => {
    setActiveProviderType(type);
    setCurrentProvider(type);
  }, []);

  const submit = useCallback(async (prompt: string) => {
    const providers = getProviders();
    const activeType = currentProvider ?? providers[0]?.type ?? null;
    const provider = providers.find(p => p.type === activeType);

    if (!provider) {
      setError('No AI provider configured.');
      return;
    }

    const adapter = createAdapter(provider);

    setResult(null);
    setDoneStreaming(false);
    setError(null);
    setIsStreaming(true);

    try {
      await streamObject<T>(adapter, prompt, partial => setResult(partial));
      setDoneStreaming(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsStreaming(false);
    }
  }, [currentProvider]);

  return {
    submit,
    result,
    isStreaming,
    doneStreaming,
    error,
    currentProvider,
    providerList,
    setProvider,
  };
}
