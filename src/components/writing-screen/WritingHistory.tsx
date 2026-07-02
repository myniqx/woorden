import { X, Trash2 } from 'lucide-preact';
import { useWritingContext } from './WritingProvider';
import { useLanguage } from '../../hooks';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function WritingHistory() {
  const { entries, drawerOpen, setDrawerOpen, viewEntry, removeEntry } = useWritingContext();
  const { t } = useLanguage();

  if (!drawerOpen) return null;

  return (
    <>
      <div
        class="fixed inset-0 bg-black/40 z-20"
        onClick={() => setDrawerOpen(false)}
      />
      <div class="fixed top-14 left-0 h-[calc(100%-3.5rem)] w-72 bg-surface shadow-(--shadow-lg) z-30 flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span class="text-sm font-semibold text-text-primary">{t.writing.title}</span>
          <button
            class="p-1 bg-transparent border-none cursor-pointer text-text-muted hover:text-text-primary"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto py-2">
          {entries.length === 0 && (
            <p class="px-4 py-8 text-xs text-text-muted text-center">{t.writing.noEntries}</p>
          )}
          {entries.map(entry => (
            <div
              key={entry.id}
              class="group flex items-center gap-2 px-3 py-2.5 mx-1 rounded-md cursor-pointer transition-colors duration-(--transition-fast) hover:bg-surface-elevated text-text-primary"
              onClick={() => viewEntry(entry.id)}
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{entry.assignment.scenario}</p>
                <p class="text-xs text-text-muted">{entry.level} · {formatDate(entry.createdAt)}</p>
              </div>
              <button
                class="opacity-0 group-hover:opacity-100 p-1 bg-transparent border-none cursor-pointer text-text-muted hover:text-error transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }}
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
