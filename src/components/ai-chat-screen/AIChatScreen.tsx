import { useEffect, useState, useCallback } from 'preact/hooks';
import { History, Plus } from 'lucide-preact';
import { ChatProvider, useChatContext } from './ChatProvider';
import { ChatHistory } from './ChatHistory';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { Modal, Button } from '../commons';
import type { CEFRLevel } from './types';
import { marked } from 'marked';
import { getProviders, getProviderMeta } from '../../services/ai';
import type { AIProvider } from '../../services/ai';
import { useAppLayout, useLanguage } from '../../hooks';
import type { Screen } from '../../types';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

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

function ChatSettingsFields() {
  const { selectedLevel, setSelectedLevel, selectedProviderId, setSelectedProviderId, selectedModel, setSelectedModel } = useChatContext();
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
          setSelectedModel(adapter.preferredModel);
        }
      })
      .catch(() => {
        setModelList([]);
        setSelectedModel(adapter.preferredModel);
      })
      .finally(() => setModelsLoading(false));
  }, [selectedProviderId]);

  return (
    <div class="flex flex-col gap-3">
      {providers.length > 0 && (
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">{t.chat.level}</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel((e.target as HTMLSelectElement).value as CEFRLevel)}
            class={selectClass}
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {providers.length > 0 && (
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">{t.chat.provider}</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId((e.target as HTMLSelectElement).value)}
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
            onChange={(e) => setSelectedModel((e.target as HTMLSelectElement).value)}
            class={selectClass}
          >
            {modelList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {providers.length === 0 && (
        <div class="flex flex-col gap-3">
          <div
            class="text-sm leading-relaxed flex flex-col gap-2
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:text-text-secondary
              [&_blockquote_p]:m-0
              [&_strong]:text-text-primary [&_strong]:font-semibold
              [&_em]:text-primary [&_em]:not-italic [&_em]:font-medium"
            dangerouslySetInnerHTML={{ __html: marked.parse(t.ai.noProvider) as string }}
          />
          <GoToAISettingsButton />
        </div>
      )}
    </div>
  );
}

function ChatSetup() {
  const { t } = useLanguage();
  return (
    <div class="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <div class="text-center">
        <h2 class="text-lg font-semibold text-text-primary m-0 mb-1">{t.chat.title}</h2>
        <p class="text-sm text-text-secondary m-0">{t.chat.subtitle}</p>
      </div>
      <div class="w-full max-w-xs">
        <ChatSettingsFields />
      </div>
    </div>
  );
}

function ChatScreenInner() {
  const { activeSession, selectedProviderId, providerList, setDrawerOpen, newChat } = useChatContext();
  const { setHeaderCenter, clearHeaderCenter } = useAppLayout();
  const { t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const providerLabel = providerList.find(p => p.type === selectedProviderId)?.label ?? '';
  const headerTitle = activeSession
    ? `${activeSession.level} · ${activeSession.topic}`
    : 'New Chat';

  useEffect(() => {
    setHeaderCenter(
      <div class="flex items-center justify-between w-full">
        <button
          class="p-1.5 bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary rounded-md"
          onClick={() => setDrawerOpen(true)}
        >
          <History size={18} />
        </button>
        <button
          class="flex items-center gap-1.5 bg-transparent border-none cursor-pointer rounded-md px-2 py-1 hover:bg-surface-elevated"
          onClick={openSettings}
        >
          <span class="text-sm font-medium text-text-primary truncate">{headerTitle}</span>
          {providerLabel && (
            <span class="text-xs text-text-muted shrink-0">· {providerLabel}</span>
          )}
        </button>
        <button
          class="p-1.5 bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary rounded-md"
          onClick={newChat}
        >
          <Plus size={18} />
        </button>
      </div>
    );
    return () => clearHeaderCenter();
  }, [activeSession?.id, activeSession?.topic, selectedProviderId, openSettings]);

  return (
    <div class="flex flex-col" style="height: 100%">
      <ChatHistory />
      {activeSession ? <ChatMessages /> : <ChatSetup />}
      <ChatInput />
      {settingsOpen && (
        <Modal onClose={() => setSettingsOpen(false)} maxWidth="sm">
          <Modal.Header title={t.chat.settings} onClose={() => setSettingsOpen(false)} />
          <Modal.Body>
            <ChatSettingsFields />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}

export function AIChatScreen() {
  return (
    <ChatProvider>
      <ChatScreenInner />
    </ChatProvider>
  );
}
