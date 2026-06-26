import { marked } from 'marked';
import type { ChatMessage as ChatMessageType } from './types';

marked.setOptions({ breaks: true });

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
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

        {reviewVisible && (
          <div class={`mt-px px-3 py-2 rounded-b-xl text-xs leading-relaxed border border-border ${
            review!.status === 'pending'
              ? 'bg-surface-elevated text-text-muted'
              : review!.status === 'error'
                ? 'bg-error-light text-error'
                : 'bg-surface-elevated text-text-secondary prose-review'
          }`}>
            {review!.status === 'pending' && <span class="tracking-[3px]">···</span>}
            {review!.status === 'error' && 'Review unavailable'}
            {review!.status === 'done' && (
              <div dangerouslySetInnerHTML={{ __html: marked.parse(review!.text) as string }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
