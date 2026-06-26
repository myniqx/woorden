import { useState } from 'preact/hooks';
import { getProviders } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { AIProviderCard } from './AIProviderCard';

const PROVIDERS: { type: ProviderType; label: string }[] = [
  { type: 'gemini', label: 'Google Gemini' },
  { type: 'groq',   label: 'Groq' },
];

export function AITab() {
  const [providers, setProviders] = useState<AIProvider[]>(getProviders);

  const refresh = () => setProviders(getProviders());

  return (
    <div class="flex flex-col gap-4">
      {PROVIDERS.map(({ type, label }) => (
        <AIProviderCard
          key={type}
          type={type}
          label={label}
          existing={providers.find(p => p.type === type) ?? null}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
