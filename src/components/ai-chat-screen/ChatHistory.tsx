import { X, Trash2, Plus } from 'lucide-preact';
import { useChatContext } from './ChatProvider';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChatHistory() {
  const { sessions, activeSession, drawerOpen, setDrawerOpen, loadSession, removeSession, newChat } = useChatContext();

  if (!drawerOpen) return null;

  return (
    <>
      <div
        class="fixed inset-0 bg-black/40 z-20"
        onClick={() => setDrawerOpen(false)}
      />
      <div class="fixed top-14 left-0 h-[calc(100%-3.5rem)] w-72 bg-surface shadow-(--shadow-lg) z-30 flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span class="text-sm font-semibold text-text-primary">Conversations</span>
          <button
            class="p-1 bg-transparent border-none cursor-pointer text-text-muted hover:text-text-primary"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button
          class="flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-md border border-dashed border-border text-sm text-text-secondary hover:text-primary hover:border-primary bg-transparent cursor-pointer transition-colors duration-(--transition-fast)"
          onClick={newChat}
        >
          <Plus size={15} />
          New chat
        </button>

        <div class="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 && (
            <p class="px-4 py-8 text-xs text-text-muted text-center">No conversations yet</p>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              class={`group flex items-center gap-2 px-3 py-2.5 mx-1 rounded-md cursor-pointer transition-colors duration-(--transition-fast) ${activeSession?.id === session.id ? 'bg-primary-light text-primary' : 'hover:bg-surface-elevated text-text-primary'}`}
              onClick={() => loadSession(session.id)}
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{session.topic}</p>
                <p class="text-xs text-text-muted">{session.level} · {formatDate(session.updatedAt)}</p>
              </div>
              <button
                class="opacity-0 group-hover:opacity-100 p-1 bg-transparent border-none cursor-pointer text-text-muted hover:text-error transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeSession(session.id); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
