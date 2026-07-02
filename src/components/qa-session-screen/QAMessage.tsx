import { useState } from 'preact/hooks';
import { Pin } from 'lucide-preact';
import { Markdown } from '../commons';
import { useLanguage } from '../../hooks';
import { useQASessionContext } from './QASessionProvider';
import type { AIErrorKind } from '../../services/ai';
import type { QAMessage as QAMessageType } from './types';

interface Props {
  message: QAMessageType;
}

const ERROR_KEYS: Record<AIErrorKind, 'rateLimit' | 'auth' | 'contextLength' | 'network' | 'unknown'> = {
  rate_limit: 'rateLimit',
  auth: 'auth',
  context_length: 'contextLength',
  network: 'network',
  aborted: 'unknown',
  unknown: 'unknown',
};

export function QAMessage({ message }: Props) {
  const { t } = useLanguage();
  const { pinMessage } = useQASessionContext();
  const [pinning, setPinning] = useState(false);
  const isUser = message.role === 'user';

  const handlePin = async () => {
    if (pinning || message.pinned) return;
    setPinning(true);
    try {
      await pinMessage(message.id);
    } finally {
      setPinning(false);
    }
  };

  return (
    <div class={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div class="max-w-[85%] flex flex-col">
        <div class={`px-4 py-2.5 text-sm leading-relaxed rounded-xl ${isUser
          ? 'rounded-br-sm bg-primary text-white'
          : 'rounded-bl-sm bg-surface-elevated text-text-primary'
          }`}>
          {message.content
            ? (isUser ? message.content : <Markdown content={message.content} class="text-sm" />)
            : <span class="opacity-50">···</span>}
        </div>

        {message.errorKind && (
          <div class="mt-1 text-xs text-error">{t.chat.errors[ERROR_KEYS[message.errorKind]]}</div>
        )}
        {message.truncated && (
          <div class="mt-1 text-xs text-text-muted">{t.chat.errors.truncated}</div>
        )}

        {!isUser && message.content && (
          <button
            class={`self-start mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-transparent border-none cursor-pointer text-xs transition-colors duration-(--transition-fast) ${message.pinned ? 'text-primary cursor-not-allowed' : 'text-text-muted hover:text-primary'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            onClick={handlePin}
            disabled={pinning || message.pinned}
            title={message.pinned ? t.qa.alreadyPinned : undefined}
          >
            <Pin size={16} class={message.pinned ? 'fill-current' : undefined} />
          </button>
        )}
      </div>
    </div>
  );
}
