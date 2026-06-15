import { useState } from 'preact/hooks';
import { BarChart3, Eye, BookOpen, AlertCircle, ChevronUp, RefreshCw, Flame } from 'lucide-preact';
import { Badge, Button } from './commons';
import type { Word, WordStats, QuizType } from '../types';
import { words } from '../services/words';
import { getAllWordStats, getStreak } from '../services/storage';
import { getStatsSummary } from '../services/wordSelector';
import { t } from '../data/translations';
import { WordListModal } from './WordListModal';
import { useLanguage } from '../hooks';

interface StatsFooterProps {
  quizType?: QuizType | null;
  needRefresh?: boolean;
  onUpdate?: () => void;
}

type Category = 'unseen' | 'learning' | 'mastered' | 'difficult';

interface WordWithStats extends Word {
  stats: WordStats;
}

function getCategorizedWords(): Record<Category, WordWithStats[]> {
  const allStats = getAllWordStats();

  const unseen: WordWithStats[] = [];
  const learning: WordWithStats[] = [];
  const mastered: WordWithStats[] = [];
  const difficult: WordWithStats[] = [];

  words.forEach((word) => {
    const stats = allStats[word.id] || { seen: 0, correct: 0, wrong: 0, lastSeen: null };
    const wordWithStats: WordWithStats = { ...word, stats };

    if (stats.seen === 0) {
      unseen.push(wordWithStats);
    } else if (stats.correct >= 3 && stats.wrong === 0) {
      mastered.push(wordWithStats);
    } else if (stats.wrong > stats.correct) {
      difficult.push(wordWithStats);
    } else {
      learning.push(wordWithStats);
    }
  });

  unseen.sort((a, b) => a.nl.localeCompare(b.nl, 'nl'));
  learning.sort((a, b) => b.stats.wrong - b.stats.correct - (a.stats.wrong - a.stats.correct));
  difficult.sort((a, b) => b.stats.wrong - a.stats.wrong);
  mastered.sort((a, b) => b.stats.correct - a.stats.correct);

  return { unseen, learning, mastered, difficult };
}

const statIconClass: Record<Category, string> = {
  unseen:    'bg-[rgba(158,158,158,0.1)] text-[#9e9e9e]',
  learning:  'bg-[rgba(255,107,53,0.1)] text-[#ff6b35]',
  mastered:  'bg-[rgba(76,175,80,0.1)] text-[#4caf50]',
  difficult: 'bg-[rgba(244,67,54,0.1)] text-[#f44336]',
};

export function StatsFooter({ quizType, needRefresh, onUpdate }: StatsFooterProps) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const stats = getStatsSummary(quizType || undefined);
  const streak = getStreak();
  const tr = (key: string) => t(key, language);
  const progressPercent = stats.total > 0 ? Math.round((stats.seen / stats.total) * 100) : 0;

  const categorizedWords = selectedCategory ? getCategorizedWords() : null;

  return (
    <>
      <footer class="bg-[var(--color-surface)] border-t border-[var(--color-border)] sticky bottom-0 z-[100]">
        <div class="flex items-center">
          <button
            class="flex-1 flex items-center justify-between px-[var(--spacing-lg)] py-[var(--spacing-md)] bg-transparent border-none cursor-pointer text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
            onClick={() => setExpanded(!expanded)}
          >
            <div class="flex items-center gap-[var(--spacing-sm)]">
              <Badge variant="soft" color="surface" size="sm" icon={BarChart3}>
                {stats.seen} / {stats.total} ({progressPercent}%)
              </Badge>
              <Badge variant="soft" color="surface" size="sm" icon={Flame}>
                {streak}
              </Badge>
            </div>
            <ChevronUp
              size={20}
              class={`text-[var(--color-text-secondary)] transition-transform duration-[var(--transition-fast)] ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {needRefresh && (
            <Button
              variant="solid" color="success" icon={RefreshCw} size="sm"
              onClick={onUpdate} title={t('updateAvailable', language)}
              class="mr-[var(--spacing-md)] pulse-glow"
            >
              {t('update', language)}
            </Button>
          )}
        </div>

        {expanded && (
          <div class="px-[var(--spacing-lg)] pb-[var(--spacing-lg)] fade-in">
            <div class="grid grid-cols-2 gap-[var(--spacing-md)] mb-[var(--spacing-md)]">
              {(
                [
                  { cat: 'unseen' as Category,    icon: Eye,         value: stats.unseen },
                  { cat: 'learning' as Category,  icon: BookOpen,    value: stats.learning },
                  { cat: 'mastered' as Category,  icon: BarChart3,   value: stats.mastered },
                  { cat: 'difficult' as Category, icon: AlertCircle, value: stats.difficult },
                ] as const
              ).map(({ cat, icon: Icon, value }) => (
                <button
                  key={cat}
                  class="flex items-center gap-[var(--spacing-sm)] p-[var(--spacing-sm)] bg-[var(--color-bg)] rounded-[var(--radius-md)] border-none cursor-pointer text-left transition-all duration-[var(--transition-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:translate-y-0"
                  onClick={() => setSelectedCategory(cat)}
                >
                  <div class={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] ${statIconClass[cat]}`}>
                    <Icon size={16} />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[length:var(--text-lg)] font-semibold text-[var(--color-text-primary)] leading-none">{value}</span>
                    <span class="text-[length:var(--text-xs)] text-[var(--color-text-secondary)]">{tr(cat)}</span>
                  </div>
                </button>
              ))}
            </div>

            <div class="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-full transition-[width] duration-[var(--transition-slow)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </footer>

      {selectedCategory && categorizedWords && (
        <WordListModal
          category={selectedCategory}
          words={categorizedWords[selectedCategory]}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}
