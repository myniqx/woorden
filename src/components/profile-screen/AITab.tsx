import { useState } from 'preact/hooks';
import { getProviders, OLLAMA_DEFAULT_URL, LMSTUDIO_DEFAULT_URL, GeminiAdapter, GroqAdapter, OllamaAdapter, LMStudioAdapter } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { AIProviderCard } from './AIProviderCard';

const PROVIDERS: { type: ProviderType; defaultUrl?: string; keyGuide?: string }[] = [
  { type: 'gemini',   keyGuide: new GeminiAdapter('').getKeyGuide!() },
  { type: 'groq',     keyGuide: new GroqAdapter('').getKeyGuide!() },
  { type: 'ollama',   defaultUrl: OLLAMA_DEFAULT_URL,   keyGuide: new OllamaAdapter('').getKeyGuide!() },
  { type: 'lmstudio', defaultUrl: LMSTUDIO_DEFAULT_URL, keyGuide: new LMStudioAdapter('').getKeyGuide!() },
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

  const refresh = () => setProviders(getProviders());

  return (
    <div class="flex flex-col gap-4">
      {PROVIDERS.map(({ type, defaultUrl, keyGuide }) => (
        <AIProviderCard
          key={type}
          type={type}
          label={LABELS[type]}
          defaultUrl={defaultUrl}
          keyGuide={keyGuide}
          existing={providers.find(p => p.type === type) ?? null}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
