import { useEffect, useRef } from 'preact/hooks';
import { useChatContext } from './ChatProvider';
import { ChatMessage } from './ChatMessage';

export function ChatMessages() {
  const { activeSession } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  if (!activeSession) return null;

  return (
    <div class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {activeSession.messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
