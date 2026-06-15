import { Check, X } from 'lucide-preact';
import type { QuizOption } from '../types';

interface OptionButtonProps {
  option: QuizOption;
  selected: boolean;
  showResult: boolean;
  onClick: () => void;
}

const base =
  'flex items-center justify-between w-full px-[var(--spacing-lg)] py-[var(--spacing-md)] ' +
  'bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-[var(--radius-lg)] ' +
  'cursor-pointer text-left text-[length:var(--text-base)] text-[var(--color-text-primary)] ' +
  'transition-[border-color,background-color,color,opacity,transform] duration-[var(--transition-fast)] ' +
  'hover:not-disabled:border-[var(--color-primary)] hover:not-disabled:bg-[var(--color-primary-light)] ' +
  'active:not-disabled:scale-[0.98] disabled:cursor-default';

const stateMap = {
  selected:  'border-[var(--color-primary)] bg-[var(--color-primary-light)]',
  correct:   'border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]',
  incorrect: 'border-[var(--color-error)] bg-[var(--color-error-light)] text-[var(--color-error)] shake',
  dimmed:    'opacity-50',
  none:      '',
};

export function OptionButton({ option, selected, showResult, onClick }: OptionButtonProps) {
  const state = !showResult
    ? selected ? 'selected' : 'none'
    : option.isCorrect
      ? 'correct'
      : selected
        ? 'incorrect'
        : 'dimmed';

  return (
    <button
      class={`${base} ${stateMap[state]}`}
      onClick={onClick}
      disabled={showResult}
    >
      <span class="flex-1">{option.text}</span>
      {showResult && option.isCorrect && (
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-success)] text-white">
          <Check size={18} />
        </span>
      )}
      {showResult && selected && !option.isCorrect && (
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-error)] text-white">
          <X size={18} />
        </span>
      )}
    </button>
  );
}
