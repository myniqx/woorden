import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Button, Markdown } from '../commons';
import { getProviders, getProviderMeta } from '../../services/ai';
import { useAppLayout, useLanguage } from '../../hooks';
import type { Screen } from '../../types';

const selectClass = 'px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary outline-none focus:border-primary cursor-pointer';

function GoToAISettingsButton() {
  const { navigateTo } = useAppLayout();
  const { t } = useLanguage();
  return (
    <Button
      variant="solid"
      color="primary"
      fullWidth
      onClick={() => { history.pushState({ screen: 'profile' }, ''); navigateTo('profile' as Screen, 'ai'); }}
    >
      {t.ai.goToSettings}
    </Button>
  );
}

interface ProviderModelSelectProps {
  selectedProviderId: string;
  selectedModel: string;
  onProviderChange: (id: string) => void;
  onModelChange: (model: string) => void;
  children?: ComponentChildren;
}

export function ProviderModelSelect({
  selectedProviderId,
  selectedModel,
  onProviderChange,
  onModelChange,
  children,
}: ProviderModelSelectProps) {
  const { t } = useLanguage();
  const providers = getProviders();
  const [modelList, setModelList] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    const provider = providers.find(p => p.type === selectedProviderId);
    if (!provider) return;
    const adapter = getProviderMeta(provider.type).createAdapter(provider.apiKey);

    setModelsLoading(true);
    adapter.getModels()
      .then(models => {
        setModelList(models);
        if (!selectedModel || !models.includes(selectedModel)) {
          const fallback = models.includes(adapter.preferredModel)
            ? adapter.preferredModel
            : (models[0] ?? adapter.preferredModel);
          onModelChange(fallback);
        }
      })
      .catch(() => {
        setModelList([]);
        onModelChange(adapter.preferredModel);
      })
      .finally(() => setModelsLoading(false));
  }, [selectedProviderId]);

  return (
    <div class="flex flex-col gap-3">
      {providers.length > 0 && children}

      {providers.length > 0 && (
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">{t.chat.provider}</label>
          <select
            value={selectedProviderId}
            onChange={(e) => onProviderChange((e.target as HTMLSelectElement).value)}
            class={selectClass}
          >
            {providers.map(p => <option key={p.type} value={p.type}>{p.label}</option>)}
          </select>
        </div>
      )}

      {modelList.length > 0 && (
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">
            {t.chat.model}{modelsLoading ? ' ···' : ''}
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange((e.target as HTMLSelectElement).value)}
            class={selectClass}
          >
            {modelList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {providers.length === 0 && (
        <div class="flex flex-col gap-3">
          <Markdown content={t.ai.noProvider} class="text-sm text-text-primary" />
          <GoToAISettingsButton />
        </div>
      )}
    </div>
  );
}
