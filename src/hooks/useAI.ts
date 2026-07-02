import { useState, useCallback } from 'preact/hooks';
import {
  getProviders,
  getActiveProviderType,
  setActiveProviderType,
  getProviderMeta,
  streamObject,
} from '../services/ai';
import type { AIProvider, ProviderType, AIStreamOptions } from '../services/ai';

interface UseAIResult<T> {
  submit: (prompt: string, options?: AIStreamOptions) => Promise<void>;
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

  const submit = useCallback(async (prompt: string, options?: AIStreamOptions) => {
    const providers = getProviders();
    const activeType = currentProvider ?? providers[0]?.type ?? null;
    const provider = providers.find(p => p.type === activeType);

    if (!provider) {
      setError('No AI provider configured.');
      return;
    }

    const adapter = getProviderMeta(provider.type).createAdapter(provider.apiKey, provider.model);

    setResult(null);
    setDoneStreaming(false);
    setError(null);
    setIsStreaming(true);

    try {
      await streamObject<T>(adapter, prompt, partial => setResult(partial), options);
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
