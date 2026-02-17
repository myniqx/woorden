import { Check, X } from 'lucide-preact';
import type { QuizOption } from '../types';
import './OptionButton.css';

interface OptionButtonProps {
  option: QuizOption;
  selected: boolean;
  showResult: boolean;
  onClick: () => void;
}

export function OptionButton({ option, selected, showResult, onClick }: OptionButtonProps) {
  const getStateClass = () => {
    if (!showResult) {
      return selected ? 'selected' : '';
    }

    if (option.isCorrect) {
      return 'correct';
    }

    if (selected && !option.isCorrect) {
      return 'incorrect';
    }

    return 'dimmed';
  };

  return (
    <button
      class={`option-button ${getStateClass()}`}
      onClick={onClick}
      disabled={showResult}
    >
      <span class="option-text">{option.text}</span>
      {showResult && option.isCorrect && (
        <span class="option-icon correct-icon">
          <Check size={18} />
        </span>
      )}
      {showResult && selected && !option.isCorrect && (
        <span class="option-icon incorrect-icon">
          <X size={18} />
        </span>
      )}
    </button>
  );
}
