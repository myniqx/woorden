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
  'flex items-center justify-center p-[var(--spacing-xs)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius-sm)] cursor-pointer text-[var(--color-text-secondary)] transition-all duration-[var(--transition-fast)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]';

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
    <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden">
      <div class="relative px-[var(--spacing-xl)] pt-[var(--spacing-xl)] pb-[var(--spacing-xl)] text-center border-b border-[var(--color-border)]">
        <span class="absolute top-[var(--spacing-sm)] left-[var(--spacing-sm)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.5px] rounded-[var(--radius-sm)]">
          {wordType}
        </span>

        <div class="absolute top-[var(--spacing-sm)] right-[var(--spacing-sm)] flex gap-[var(--spacing-xs)]">
          {canPin && (
            <button
              class={`${actionBtnBase} ${pinned ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] hover:text-white' : ''}`}
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

        <p class="text-[length:var(--text-2xl)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-sm)]">
          {questionText}
        </p>
        {subtext && (
          <p class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">{subtext}</p>
        )}
        {below}
      </div>

      <div class="flex flex-col gap-[var(--spacing-sm)] p-[var(--spacing-md)]">
        {children}
      </div>
    </div>
  );
}
