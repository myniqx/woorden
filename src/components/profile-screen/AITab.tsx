import { useState } from 'preact/hooks';
import { useLanguage } from '../../hooks';
import { getProviders, OLLAMA_DEFAULT_URL, LMSTUDIO_DEFAULT_URL, GeminiAdapter, GroqAdapter, OllamaAdapter, LMStudioAdapter } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { AIProviderCard } from './AIProviderCard';

const GUIDE_FN: Partial<Record<ProviderType, (lang: string) => string>> = {
  gemini:   (lang) => new GeminiAdapter('').getKeyGuide!(lang),
  groq:     (lang) => new GroqAdapter('').getKeyGuide!(lang),
  ollama:   (lang) => new OllamaAdapter('').getKeyGuide!(lang),
  lmstudio: (lang) => new LMStudioAdapter('').getKeyGuide!(lang),
};

const PROVIDERS: { type: ProviderType; defaultUrl?: string }[] = [
  { type: 'gemini' },
  { type: 'groq' },
  { type: 'ollama',   defaultUrl: OLLAMA_DEFAULT_URL },
  { type: 'lmstudio', defaultUrl: LMSTUDIO_DEFAULT_URL },
];

const LABELS: Record<ProviderType, string> = {
  gemini:   'Google Gemini',
  groq:     'Groq',
  ollama:   'Ollama',
  lmstudio: 'LM Studio',
  server:   'Server',
};

export function AITab() {
  const [providers, setProviders] = useState<AIProvider[]>(getProviders);
  const { language } = useLanguage();

  const refresh = () => setProviders(getProviders());

  return (
    <div class="flex flex-col gap-4">
      {PROVIDERS.map(({ type, defaultUrl }) => (
        <AIProviderCard
          key={type}
          type={type}
          label={LABELS[type]}
          defaultUrl={defaultUrl}
          keyGuide={GUIDE_FN[type]?.(language)}
          existing={providers.find(p => p.type === type) ?? null}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
