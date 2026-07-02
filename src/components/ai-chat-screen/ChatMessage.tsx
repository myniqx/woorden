import { Markdown } from '../commons';
import { useLanguage } from '../../hooks';
import type { AIErrorKind } from '../../services/ai';
import type { ChatMessage as ChatMessageType } from './types';

interface Props {
  message: ChatMessageType;
}

const ERROR_KEYS: Record<AIErrorKind, 'rateLimit' | 'auth' | 'contextLength' | 'network' | 'unknown'> = {
  rate_limit: 'rateLimit',
  auth: 'auth',
  context_length: 'contextLength',
  network: 'network',
  aborted: 'unknown',
  unknown: 'unknown',
};

export function ChatMessage({ message }: Props) {
  const { t } = useLanguage();
  const isUser = message.role === 'user';
  const review = isUser ? message.review : undefined;
  const reviewVisible = review?.status === 'pending'
    || review?.status === 'error'
    || (review?.status === 'done' && !!review.text);

  const bubbleRounded = reviewVisible
    ? 'rounded-t-xl'
    : isUser
      ? 'rounded-xl rounded-br-sm'
      : 'rounded-xl rounded-bl-sm';

  return (
    <div class={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div class="max-w-[85%] flex flex-col">
        <div class={`px-4 py-2.5 text-sm leading-relaxed ${bubbleRounded} ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-surface-elevated text-text-primary'
        }`}>
          {message.content || <span class="opacity-50">···</span>}
        </div>

        {message.errorKind && (
          <div class="mt-1 text-xs text-error">{t.chat.errors[ERROR_KEYS[message.errorKind]]}</div>
        )}
        {message.truncated && (
          <div class="mt-1 text-xs text-text-muted">{t.chat.errors.truncated}</div>
        )}

        {reviewVisible && (
          <div class={`mt-px px-3 py-2 rounded-b-xl text-xs leading-relaxed border border-border ${
            review!.status === 'pending'
              ? 'bg-surface-elevated text-text-muted'
              : review!.status === 'error'
                ? 'bg-error-light text-error'
                : 'bg-surface-elevated text-text-secondary'
          }`}>
            {review!.status === 'pending' && <span class="tracking-[3px]">···</span>}
            {review!.status === 'error' && 'Review unavailable'}
            {review!.status === 'done' && (
              <Markdown content={review!.text} class="text-xs" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
