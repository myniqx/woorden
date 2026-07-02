import { useState, useCallback } from 'preact/hooks';
import { History, Plus } from 'lucide-preact';
import { ChatProvider, useChatContext } from './ChatProvider';
import { ChatHistory } from './ChatHistory';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { Modal, Button } from '../commons';
import { ProviderModelSelect } from '../ai-shared';
import type { CEFRLevel } from './types';
import { useHeaderCenter, useLanguage } from '../../hooks';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const selectClass = 'px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary outline-none focus:border-primary cursor-pointer';

function ChatSettingsFields() {
  const { selectedLevel, setSelectedLevel, selectedProviderId, setSelectedProviderId, selectedModel, setSelectedModel } = useChatContext();
  const { t } = useLanguage();

  return (
    <ProviderModelSelect
      selectedProviderId={selectedProviderId}
      selectedModel={selectedModel}
      onProviderChange={setSelectedProviderId}
      onModelChange={setSelectedModel}
    >
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
    </ProviderModelSelect>
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
  const { t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const providerLabel = providerList.find(p => p.type === selectedProviderId)?.label ?? '';
  const headerTitle = activeSession
    ? `${activeSession.level} · ${activeSession.topic}`
    : 'New Chat';

  useHeaderCenter(
    <div class="flex items-center justify-between w-full">
      <Button variant="ghost" color="default" size="icon" icon={History} onClick={() => setDrawerOpen(true)} />
      <Button variant="ghost" color="default" onClick={openSettings} class="flex-1 min-w-0 max-w-[60%]">
        <span class="text-sm font-medium text-text-primary truncate">{headerTitle}</span>
        {providerLabel && (
          <span class="text-xs text-text-muted shrink-0">· {providerLabel}</span>
        )}
      </Button>
      <Button variant="ghost" color="default" size="icon" icon={Plus} onClick={newChat} />
    </div>,
    [activeSession?.id, activeSession?.topic, selectedProviderId, providerLabel, openSettings, newChat, setDrawerOpen],
  );

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
