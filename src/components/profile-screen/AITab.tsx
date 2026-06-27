import { useState } from 'preact/hooks';
import { useLanguage } from '../../hooks';
import { getProviders, PROVIDER_REGISTRY } from '../../services/ai';
import type { AIProvider } from '../../services/ai';
import { AIProviderCard } from './AIProviderCard';

export function AITab() {
  const [providers, setProviders] = useState<AIProvider[]>(getProviders);
  const { language } = useLanguage();

  const refresh = () => setProviders(getProviders());

  return (
    <div class="flex flex-col gap-4">
      {PROVIDER_REGISTRY.filter(p => p.type !== 'server').map((meta) => (
        <AIProviderCard
          key={meta.type}
          type={meta.type}
          label={meta.label}
          defaultUrl={meta.defaultUrl ?? undefined}
          keyGuide={meta.getKeyGuide?.(language)}
          existing={providers.find(p => p.type === meta.type) ?? null}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
