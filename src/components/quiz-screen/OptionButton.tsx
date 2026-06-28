import { Check, X } from 'lucide-preact';
import type { QuizOption } from '../../types';

interface OptionButtonProps {
  option: QuizOption;
  selected: boolean;
  showResult: boolean;
  onClick: () => void;
}

const base =
  'flex items-center justify-between w-full px-6 py-4 ' +
  'bg-bg border-2 border-border rounded-lg ' +
  'cursor-pointer text-left text-base text-text-primary ' +
  'transition-[border-color,background-color,color,opacity,transform] duration-(--transition-fast) ' +
  'hover:not-disabled:border-primary hover:not-disabled:bg-primary-light ' +
  'active:not-disabled:scale-[0.98] disabled:cursor-default';

const stateMap = {
  selected: 'border-primary bg-primary-light',
  correct: 'border-success bg-success-light text-success',
  incorrect: 'border-error bg-error-light text-error shake',
  dimmed: 'opacity-50',
  none: '',
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
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-success text-white">
          <Check size={18} />
        </span>
      )}
      {showResult && selected && !option.isCorrect && (
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-error text-white">
          <X size={18} />
        </span>
      )}
    </button>
  );
}
