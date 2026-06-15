import type { ComponentChildren } from 'preact';
import { Pin, HelpCircle } from 'lucide-preact';
import { Button } from './Button';

interface QuizCardProps {
  wordType: string;
  questionText: string;
  subtext?: string;
  pinned?: boolean;
  canPin?: boolean;
  hasHelp?: boolean;
  onPinToggle?: () => void;
  onHelpOpen?: () => void;
  children: ComponentChildren;
  below?: ComponentChildren;
}

const actionBtnBase =
  'flex items-center justify-center p-1 bg-transparent border border-border rounded-sm cursor-pointer text-text-secondary transition-all duration-(--transition-fast) hover:bg-surface-elevated hover:border-primary hover:text-primary';

export function QuizCard({
  wordType,
  questionText,
  subtext,
  pinned = false,
  canPin = false,
  hasHelp = false,
  onPinToggle,
  onHelpOpen,
  children,
  below,
}: QuizCardProps) {
  return (
    <div class="bg-surface border border-border rounded-xl overflow-hidden">
      <div class="relative px-8 pt-8 pb-8 text-center border-b border-border">
        <span class="absolute top-2 left-2 px-2 py-1 bg-primary-light text-primary text-xs font-semibold uppercase tracking-[0.5px] rounded-sm">
          {wordType}
        </span>

        <div class="absolute top-2 right-2 flex gap-1">
          {canPin && (
            <button
              class={`${actionBtnBase} ${pinned ? 'bg-primary border-primary text-white hover:bg-primary-hover hover:border-primary-hover hover:text-white' : ''}`}
              onClick={onPinToggle}
              aria-label={pinned ? 'Unpin word' : 'Pin word'}
            >
              <Pin size={18} />
            </button>
          )}
          {hasHelp && (
            <Button variant="ghost" size="icon" icon={HelpCircle} onClick={onHelpOpen} aria-label="Help" />
          )}
        </div>

        <p class="text-2xl font-semibold text-text-primary mb-2">
          {questionText}
        </p>
        {subtext && (
          <p class="text-sm text-text-secondary">{subtext}</p>
        )}
        {below}
      </div>

      <div class="flex flex-col gap-2 p-4">
        {children}
      </div>
    </div>
  );
}
