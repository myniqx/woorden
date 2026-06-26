import { useState } from 'preact/hooks';
import { Send } from 'lucide-preact';
import { useChatContext } from './ChatProvider';

export function ChatInput() {
  const { sendMessage, isStreaming } = useChatContext();
  const [text, setText] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setText('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="px-4 py-3 border-t border-border bg-surface shrink-0">
      <div class="flex items-end gap-2">
        <textarea
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="Write in Dutch..."
          rows={1}
          disabled={isStreaming}
          class="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-[border-color] duration-(--transition-fast) disabled:opacity-50"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isStreaming}
          class="p-2 rounded-lg bg-primary text-white border-none cursor-pointer hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-(--transition-fast) shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
