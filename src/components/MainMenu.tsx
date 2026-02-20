import { useState } from 'preact/hooks';
import { Target, BookOpen, FileText, Layers, Pin, PenLine, GitBranch } from 'lucide-preact';
import type { QuizType, QuizMode, Language } from '../types';
import { t } from '../data/translations';
import { getSelectedWordCount } from '../services/words';
import { getPinnedWordCount, MIN_PINS_FOR_QUIZ, canPinInQuizType } from '../services/storage';
import { WordPoolModal } from './WordPoolModal';
import { SupportButton } from './SupportButton';
import './MainMenu.css';

interface MainMenuProps {
  onStartQuiz: (quizType: QuizType, mode?: QuizMode) => void;
  language: Language;
}

interface QuizTypeCard {
  type: QuizType;
  icon: typeof Target;
  color: string;
}

const quizTypes: QuizTypeCard[] = [
  { type: 'nativeToDutch', icon: Target, color: '#ff6b35' },
  { type: 'dutchToNative', icon: BookOpen, color: '#4caf50' },
  { type: 'article', icon: FileText, color: '#2196f3' },
  { type: 'nativeToDutch_write', icon: PenLine, color: '#9c27b0' },
  { type: 'verbForms', icon: GitBranch, color: '#00bcd4' },
];

export function MainMenu({ onStartQuiz, language }: MainMenuProps) {
  const [showWordPool, setShowWordPool] = useState(false);
  const [, forceUpdate] = useState(0);

  const tr = (key: string) => t(key, language);
  const selectedCount = getSelectedWordCount();

  const handleWordPoolClose = () => {
    setShowWordPool(false);
    forceUpdate(n => n + 1);
  };

  return (
    <div class="main-menu fade-in">
      <button class="word-pool-button" onClick={() => setShowWordPool(true)}>
        <Layers size={20} />
        <div class="word-pool-button-content">
          <span class="word-pool-button-title">{tr('wordPool')}</span>
          <span class="word-pool-button-count">
            {t('wordPoolDesc', language, { count: selectedCount })}
          </span>
        </div>
      </button>

      <div class="quiz-type-grid">
        {quizTypes.map(({ type, icon: Icon, color }) => {
          const canHavePin = canPinInQuizType(type);
          const pinCount = canHavePin ? getPinnedWordCount(type) : 0;
          const canStartPinnedQuiz = pinCount >= MIN_PINS_FOR_QUIZ;
          const pinsNeeded = MIN_PINS_FOR_QUIZ - pinCount;

          return (
            <div key={type} class={`quiz-type-group ${canHavePin ? 'has-pin' : ''}`}>
              <button
                class="quiz-type-card"
                onClick={() => onStartQuiz(type, 'normal')}
                style={{ '--card-color': color } as any}
              >
                <div class="card-icon">
                  <Icon size={32} />
                </div>
                <div class="card-content">
                  <h2 class="card-title">{tr(`quiz_${type}`)}</h2>
                  <p class="card-description">{tr(`quiz_${type}_desc`)}</p>
                </div>
              </button>

              {canHavePin && (
                <button
                  class={`pinned-quiz-card ${!canStartPinnedQuiz ? 'disabled' : ''}`}
                  onClick={() => canStartPinnedQuiz && onStartQuiz(type, 'pinned')}
                  disabled={!canStartPinnedQuiz}
                  style={{ '--card-color': color } as any}
                >
                  <Pin size={18} />
                  <div class="pinned-quiz-content">
                    <span class="pinned-quiz-title">{tr('pinnedWords')}</span>
                    <span class="pinned-quiz-desc">
                      {canStartPinnedQuiz
                        ? t('pinnedWordsDesc', language, { count: pinCount })
                        : t('pinnedWordsDisabled', language, { count: pinsNeeded })}
                    </span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <SupportButton language={language} />

      {showWordPool && (
        <WordPoolModal language={language} onClose={handleWordPoolClose} />
      )}
    </div>
  );
}
