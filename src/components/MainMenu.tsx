import { useState } from 'preact/hooks';
import { Target, BookOpen, FileText, Layers, Pin, PenLine, GitBranch } from 'lucide-preact';
import type { QuizType, QuizMode } from '../types';
import { useLanguage } from '../hooks';
import { getSelectedWordCount, getAvailableLevels, getChunkCount, getChunkWordCount, getLevelWordCount, isChunkEnabled } from '../services/words';
import { getPinnedWordCount, MIN_PINS_FOR_QUIZ, canPinInQuizType } from '../services/storage';
import { WordPoolModal } from './WordPoolModal';
import { SupportButton } from './SupportButton';
import { Badge } from './commons';
import { LanguageKeys } from '@/locales';

interface MainMenuProps {
  onStartQuiz: (quizType: QuizType, mode?: QuizMode) => void;
  onOpenChangelog: () => void;
  hasNewChangelog: boolean;
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

const quizTitle = (t: LanguageKeys, type: QuizType): string => ({
  nativeToDutch: t.quiz.nativeToDutch.title,
  dutchToNative: t.quiz.dutchToNative.title,
  article: t.quiz.article.title,
  nativeToDutch_write: t.quiz.write.title,
  verbForms: t.quiz.verbForms.title,
}[type]);

const quizDesc = (t: LanguageKeys, type: QuizType): string => ({
  nativeToDutch: t.quiz.nativeToDutch.desc,
  dutchToNative: t.quiz.dutchToNative.desc,
  article: t.quiz.article.desc,
  nativeToDutch_write: t.quiz.write.desc,
  verbForms: t.quiz.verbForms.desc,
}[type]);

export function MainMenu({ onStartQuiz, onOpenChangelog, hasNewChangelog }: MainMenuProps) {
  const { t, merge } = useLanguage();
  const [showWordPool, setShowWordPool] = useState(false);
  const [, forceUpdate] = useState(0);

  const selectedCount = getSelectedWordCount();

  const levelBadges = getAvailableLevels().map(level => {
    const total = getLevelWordCount(level);
    const chunkCount = getChunkCount(level);
    let selected = 0;
    for (let i = 0; i < chunkCount; i++) {
      if (isChunkEnabled(level, i)) selected += getChunkWordCount(level, i);
    }
    return { level, selected, total };
  });

  const handleWordPoolClose = () => {
    setShowWordPool(false);
    forceUpdate(n => n + 1);
  };

  return (
    <div class="flex-1 flex flex-col gap-4 py-6 fade-in">
      <button
        class="flex items-center gap-4 px-6 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-left text-[var(--color-primary)] transition-all duration-[var(--transition-normal)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
        onClick={() => setShowWordPool(true)}
      >
        <Layers size={20} />
        <div class="flex flex-col gap-0.5">
          <span class="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)]">{t.wordPool.title}</span>
          <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            {merge(t.wordPool.desc, { count: selectedCount })}
          </span>
          <div class="flex flex-wrap gap-1 mt-1">
            {levelBadges.map(({ level, selected, total }) => {
              const muted = selected === 0;
              return (
                <span key={level} class={`inline-flex items-center text-(length:--text-xs) rounded-full overflow-hidden border ${muted ? 'border-[var(--color-border)]' : 'border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]'}`}>
                  <span class={`font-bold w-8 text-right px-1.5 py-0.5 ${muted ? 'bg-[var(--color-text-muted)] text-[var(--color-surface)]' : 'bg-[var(--color-primary)] text-white'}`}>{level}</span>
                  <span class={`px-[7px] py-0.5 ${muted ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]' : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'}`}>{selected}/{total}</span>
                </span>
              );
            })}
          </div>
        </div>
      </button>

      <div class="flex flex-col gap-4">
        {quizTypes.map(({ type, icon: Icon, color }) => {
          const canHavePin = canPinInQuizType(type);
          const pinCount = canHavePin ? getPinnedWordCount(type) : 0;
          const canStartPinnedQuiz = pinCount >= MIN_PINS_FOR_QUIZ;
          const pinsNeeded = MIN_PINS_FOR_QUIZ - pinCount;

          return (
            <div key={type} class="flex flex-col gap-1">
              <button
                class="group flex items-center gap-6 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] cursor-pointer text-left transition-all duration-[var(--transition-normal)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:translate-y-0"
                style={{ '--card-color': color } as any}
                onClick={() => onStartQuiz(type, 'normal')}
              >
                <div class="flex items-center justify-center w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--color-primary-light)] text-[var(--card-color,var(--color-primary))] shrink-0 transition-colors duration-[var(--transition-normal)] group-hover:bg-[var(--card-color,var(--color-primary))] group-hover:text-white">
                  <Icon size={32} />
                </div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-[length:var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-1">{quizTitle(t, type)}</h2>
                  <p class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] leading-snug">{quizDesc(t, type)}</p>
                </div>
              </button>

              {canHavePin && (
                <button
                  class={`flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)_var(--radius-sm)_var(--radius-xl)_var(--radius-xl)] cursor-pointer text-left text-[var(--card-color,var(--color-primary))] transition-all duration-[var(--transition-normal)] hover:not-disabled:border-[var(--card-color,var(--color-primary))] hover:not-disabled:bg-[var(--color-surface-elevated)] disabled:opacity-60 disabled:cursor-not-allowed disabled:text-[var(--color-text-secondary)]`}
                  onClick={() => canStartPinnedQuiz && onStartQuiz(type, 'pinned')}
                  disabled={!canStartPinnedQuiz}
                  style={{ '--card-color': color } as any}
                >
                  <Pin size={18} />
                  <div class="flex flex-col gap-0.5 flex-1">
                    <span class="text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)]">{t.wordList.pinnedWords}</span>
                    <span class="text-[length:var(--text-xs)] text-[var(--color-text-secondary)]">
                      {canStartPinnedQuiz
                        ? merge(t.wordList.pinnedWordsDesc, { count: pinCount })
                        : merge(t.wordList.pinnedWordsDisabled, { count: pinsNeeded })}
                    </span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <SupportButton />

      <button
        class={`flex items-center justify-center gap-1 w-full px-4 py-2 bg-none border rounded-[var(--radius-md)] text-[length:var(--text-sm)] cursor-pointer transition-[color,border-color] duration-[var(--transition-fast)] ${hasNewChangelog ? 'border-[var(--color-primary)] text-[var(--color-primary)] changelog-glow' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'}`}
        onClick={onOpenChangelog}
      >
        <span>Changelog</span>
        {hasNewChangelog && <Badge dot />}
      </button>

      {showWordPool && (
        <WordPoolModal onClose={handleWordPoolClose} />
      )}
    </div>
  );
}
