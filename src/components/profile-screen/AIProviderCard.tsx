import { useState } from 'preact/hooks';
import { marked } from 'marked';
import { Eye, EyeOff, Check } from 'lucide-preact';
import { Button, Modal } from '../commons';
import { GeminiAdapter, GroqAdapter, OllamaAdapter, LMStudioAdapter, addProvider, removeProvider } from '../../services/ai';
import type { AIProvider, ProviderType } from '../../services/ai';
import { useLanguage } from '../../hooks';

marked.use({ breaks: true });

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
  let adapter;
  if (type === 'gemini')        adapter = new GeminiAdapter(apiKey);
  else if (type === 'groq')     adapter = new GroqAdapter(apiKey);
  else if (type === 'ollama')   adapter = new OllamaAdapter(apiKey);
  else if (type === 'lmstudio') adapter = new LMStudioAdapter(apiKey);
  else throw new Error('Server provider cannot be tested here.');

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
          <button
            class="text-xs text-text-muted hover:text-error bg-transparent border-none cursor-pointer p-0"
            onClick={handleRemove}
          >
            {t.common.remove}
          </button>
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
          <button
            class="absolute right-3 text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer p-0"
            onClick={() => setShowKey(v => !v)}
            type="button"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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
        <button
          class="text-xs text-text-muted hover:text-primary bg-transparent border-none cursor-pointer p-0 text-left"
          onClick={() => setGuideOpen(true)}
        >
          {isLocal ? t.ai.getSetupHelp : t.ai.getApiKey}
        </button>
      )}

      {guideOpen && keyGuide && (
        <Modal onClose={() => setGuideOpen(false)} maxWidth="sm">
          <Modal.Header title={isLocal ? t.ai.setupModalTitle.replace('{label}', label) : t.ai.apiKeyModalTitle.replace('{label}', label)} onClose={() => setGuideOpen(false)} />
          <Modal.Body>
            <div
              class="text-sm text-text-primary leading-relaxed
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:text-text-primary
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-4
                [&_li]:text-text-primary
                [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                [&_code]:bg-surface-elevated [&_code]:text-text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:text-xs [&_code]:font-mono
                [&_pre]:bg-surface-elevated [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto
                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs [&_pre_code]:font-mono
                [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:text-text-secondary [&_blockquote]:text-xs
                [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: marked.parse(keyGuide) as string }}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
