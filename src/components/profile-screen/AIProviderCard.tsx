import { useState } from 'preact/hooks';
import { Eye, EyeOff, Check } from 'lucide-preact';
import { Button } from '../commons';
import { GeminiAdapter, GroqAdapter, addProvider, removeProvider } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { useLanguage } from '../../hooks';

interface Props {
  type: ProviderType;
  label: string;
  existing: AIProvider | null;
  onSaved: () => void;
}

const TEST_PROMPT = 'Reply with a json object: {"ok": true}';

async function testProvider(type: ProviderType, apiKey: string): Promise<void> {
  let adapter;
  if (type === 'gemini') adapter = new GeminiAdapter(apiKey);
  else if (type === 'groq') adapter = new GroqAdapter(apiKey);
  else throw new Error('Server provider cannot be tested here.');

  let got = '';
  for await (const chunk of adapter.stream(TEST_PROMPT)) {
    got += chunk;
    if (got.length > 0) return;
  }
  if (!got) throw new Error('No response received.');
}

export function AIProviderCard({ type, label, existing, onSaved }: Props) {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '');
  const [showKey, setShowKey] = useState(false);
  const [confirmed, setConfirmed] = useState(existing?.confirmedAt != null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const isDirty = apiKey !== (existing?.apiKey ?? '');

  const handleConfirm = async () => {
    if (!apiKey.trim()) return;
    setConfirming(true);
    setConfirmError(null);
    setConfirmed(false);
    try {
      await testProvider(type, apiKey.trim());
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
      apiKey: apiKey.trim(),
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
          <button
            class="text-xs text-text-muted hover:text-error bg-transparent border-none cursor-pointer p-0"
            onClick={handleRemove}
          >
            {t.common.remove}
          </button>
        )}
      </div>

      <div class="relative flex items-center">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onInput={(e) => {
            setApiKey((e.target as HTMLInputElement).value);
            setConfirmed(false);
          }}
          placeholder={`${label} API key`}
          class="w-full pr-10 px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-[border-color] duration-(--transition-fast)"
        />
        <button
          class="absolute right-3 text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer p-0"
          onClick={() => setShowKey(v => !v)}
          type="button"
        >
          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {confirmError && (
        <p class="m-0 text-xs text-error">{confirmError}</p>
      )}

      <div class="flex gap-2">
        <Button
          variant="outline"
          fullWidth
          onClick={handleConfirm}
          disabled={!apiKey.trim() || confirming}
        >
          {confirming ? '···' : confirmed ? <span class="flex items-center gap-1"><Check size={14} /> {t.common.confirmed}</span> : t.common.confirm}
        </Button>
        <Button
          variant="soft"
          color="primary"
          fullWidth
          onClick={handleSave}
          disabled={!confirmed || (!isDirty && !!existing)}
        >
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}
