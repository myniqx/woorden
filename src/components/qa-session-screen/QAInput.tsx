import { useState } from 'preact/hooks';
import { Send } from 'lucide-preact';
import { useQASessionContext } from './QASessionProvider';
import { Button } from '../commons';
import { useLanguage } from '../../hooks';

export function QAInput() {
  const { sendMessage, isStreaming } = useQASessionContext();
  const { t } = useLanguage();
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
          placeholder={t.qa.inputPlaceholder}
          rows={1}
          disabled={isStreaming}
          class="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-[border-color] duration-(--transition-fast) disabled:opacity-50"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <Button
          variant="solid"
          color="primary"
          size="icon"
          icon={Send}
          onClick={handleSend}
          disabled={!text.trim() || isStreaming}
          class="shrink-0"
        />
      </div>
    </div>
  );
}
