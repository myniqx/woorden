import { useState } from 'preact/hooks';
import { Eye, EyeOff, Check } from 'lucide-preact';
import { Button, Markdown, Modal } from '../commons';
import { addProvider, removeProvider, getProviderMeta } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { useLanguage } from '../../hooks';


interface Props {
  type: ProviderType;
  label: string;
  defaultUrl?: string;
  keyGuide?: string;
  existing: AIProvider | null;
  onSaved: () => void;
}

const TEST_PROMPT = 'Reply with a json object: {"ok": true}';

async function testProvider(type: ProviderType, apiKey: string): Promise<void> {
  const adapter = getProviderMeta(type).createAdapter(apiKey);
  let got = '';
  for await (const chunk of adapter.stream(TEST_PROMPT)) {
    got += chunk;
    if (got.length > 0) return;
  }
  if (!got) throw new Error('No response received.');
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function AIProviderCard({ type, label, defaultUrl, keyGuide, existing, onSaved }: Props) {
  const { t } = useLanguage();
  const isLocal = !!defaultUrl;
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '');
  const [showKey, setShowKey] = useState(false);
  const [confirmed, setConfirmed] = useState(existing?.confirmedAt != null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const isDirty = apiKey !== (existing?.apiKey ?? '');
  const effectiveUrl = apiKey.trim() || defaultUrl!;
  const localEnabled = isLocal && (apiKey.trim() === '' || isValidUrl(apiKey.trim()));

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    setConfirmed(false);
    try {
      await testProvider(type, isLocal ? effectiveUrl : apiKey.trim());
      setConfirmed(true);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  };

  const handleSave = () => {
    addProvider({
      type,
      label,
      apiKey: isLocal ? effectiveUrl : apiKey.trim(),
      createdAt: existing?.createdAt ?? Date.now(),
      confirmedAt: Date.now(),
    });
    onSaved();
  };

  const handleRemove = () => {
    removeProvider(type);
    setApiKey('');
    setConfirmed(false);
    onSaved();
  };

  const inputClass = 'w-full px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-[border-color] duration-(--transition-fast)';
  const sectionH3 = 'flex items-center gap-2 m-0 mb-3 text-sm font-semibold text-text-primary';

  return (
    <div class="flex flex-col gap-3 p-4 rounded-lg border border-border bg-surface">
      <div class="flex items-center justify-between">
        <h4 class={sectionH3}>
          {label}
          {existing?.confirmedAt && !isDirty && (
            <span class="flex items-center gap-1 text-xs text-success font-normal">
              <Check size={13} /> {t.common.confirmed}
            </span>
          )}
        </h4>
        {existing && (
          <Button variant="ghost" color="danger" size="sm" onClick={handleRemove}>
            {t.common.remove}
          </Button>
        )}
      </div>

      {isLocal ? (
        <input
          type="text"
          value={apiKey}
          disabled={!!existing}
          onInput={(e) => {
            setApiKey((e.target as HTMLInputElement).value);
            setConfirmed(false);
          }}
          placeholder={defaultUrl}
          class={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ) : (
        <div class="relative flex items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            disabled={!!existing}
            onInput={(e) => {
              setApiKey((e.target as HTMLInputElement).value);
              setConfirmed(false);
            }}
            placeholder={`${label} API key`}
            class={`${inputClass} pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <Button
            variant="ghost"
            color="muted"
            size="icon"
            icon={showKey ? EyeOff : Eye}
            onClick={() => setShowKey(v => !v)}
            class="absolute right-1"
          />
        </div>
      )}

      {confirmError && (
        <p class="m-0 text-xs text-error">{confirmError}</p>
      )}

      <div class="flex gap-2">
        <Button
          variant="outline"
          fullWidth
          onClick={handleConfirm}
          disabled={isLocal ? (!localEnabled || confirming) : (!apiKey.trim() || confirming)}
        >
          {confirming
            ? '···'
            : confirmed
              ? <span class="flex items-center gap-1"><Check size={14} /> {t.common.confirmed}</span>
              : isLocal ? t.ai.connect : t.common.confirm}
        </Button>
        <Button
          variant="soft"
          color="primary"
          fullWidth
          onClick={handleSave}
          disabled={!confirmed || (!isDirty && !!existing && !(isLocal && !apiKey.trim()))}
        >
          {t.common.save}
        </Button>
      </div>

      {keyGuide && (
        <Button variant="ghost" color="muted" size="sm" onClick={() => setGuideOpen(true)} class="self-start">
          {isLocal ? t.ai.getSetupHelp : t.ai.getApiKey}
        </Button>
      )}

      {guideOpen && keyGuide && (
        <Modal onClose={() => setGuideOpen(false)} maxWidth="sm">
          <Modal.Header title={isLocal ? t.ai.setupModalTitle.replace('{label}', label) : t.ai.apiKeyModalTitle.replace('{label}', label)} onClose={() => setGuideOpen(false)} />
          <Modal.Body>
            <Markdown content={keyGuide} class="text-sm text-text-primary" />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
