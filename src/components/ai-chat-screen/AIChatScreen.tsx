import { History, Plus } from 'lucide-preact';
import { ChatProvider, useChatContext } from './ChatProvider';
import { ChatHistory } from './ChatHistory';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { CEFRLevel } from './types';
import { getProviders } from '../../services/ai';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

function ChatSetup() {
  const { selectedLevel, setSelectedLevel, selectedProviderId, setSelectedProviderId } = useChatContext();
  const providers = getProviders();

  return (
    <div class="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <div class="text-center">
        <h2 class="text-lg font-semibold text-text-primary m-0 mb-1">Dutch Conversation</h2>
        <p class="text-sm text-text-secondary m-0">Practice speaking Dutch with an AI partner</p>
      </div>

      <div class="flex flex-col gap-3 w-full max-w-xs">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel((e.target as HTMLSelectElement).value as CEFRLevel)}
            class="px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary outline-none focus:border-primary cursor-pointer"
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {providers.length > 0 && (
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-text-secondary uppercase tracking-[0.05em]">AI Provider</label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId((e.target as HTMLSelectElement).value)}
              class="px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary outline-none focus:border-primary cursor-pointer"
            >
              {providers.map(p => <option key={p.type} value={p.type}>{p.label}</option>)}
            </select>
          </div>
        )}

        {providers.length === 0 && (
          <p class="text-xs text-text-muted text-center px-2">
            No AI provider configured. Add one in Settings → AI.
          </p>
        )}
      </div>
    </div>
  );
}

function ChatScreenInner() {
  const { activeSession, setDrawerOpen, newChat } = useChatContext();

  return (
    <div class="flex flex-col" style="height: 100%">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
        <button
          class="p-1.5 bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary rounded-md"
          onClick={() => setDrawerOpen(true)}
        >
          <History size={20} />
        </button>
        <span class="text-sm font-semibold text-text-primary">
          {activeSession ? `${activeSession.level} · ${activeSession.topic}` : 'New Chat'}
        </span>
        <button
          class="p-1.5 bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary rounded-md"
          onClick={newChat}
        >
          <Plus size={20} />
        </button>
      </div>

      <ChatHistory />

      {activeSession ? <ChatMessages /> : <ChatSetup />}

      <ChatInput />
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
