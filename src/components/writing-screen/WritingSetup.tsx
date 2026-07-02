import type { CEFRLevel } from '../ai-chat-screen/types';
import { ProviderModelSelect } from '../ai-shared';
import { Button } from '../commons';
import { useLanguage } from '../../hooks';
import { useWritingContext } from './WritingProvider';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const selectClass = 'px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary outline-none focus:border-primary cursor-pointer';

export function WritingSetup() {
  const { t } = useLanguage();
  const { selectedLevel, setSelectedLevel, selectedProviderId, setSelectedProviderId, selectedModel, setSelectedModel, providerList, startAssignment } = useWritingContext();

  return (
    <div class="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <div class="text-center">
        <h2 class="text-lg font-semibold text-text-primary m-0 mb-1">{t.writing.title}</h2>
        <p class="text-sm text-text-secondary m-0">{t.writing.subtitle}</p>
      </div>
      <div class="w-full max-w-xs flex flex-col gap-3">
        <ProviderModelSelect
          selectedProviderId={selectedProviderId}
          selectedModel={selectedModel}
          onProviderChange={setSelectedProviderId}
          onModelChange={setSelectedModel}
        >
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">{t.writing.level}</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel((e.target as HTMLSelectElement).value as CEFRLevel)}
              class={selectClass}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </ProviderModelSelect>

        {providerList.length > 0 && (
          <Button variant="solid" color="primary" fullWidth onClick={startAssignment}>
            {t.writing.startButton}
          </Button>
        )}
      </div>
    </div>
  );
}
