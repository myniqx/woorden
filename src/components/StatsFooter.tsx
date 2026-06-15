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
import './StatsFooter.css';

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
      <footer class={`stats-footer ${expanded ? 'expanded' : ''}`}>
        <div class="stats-footer-row">
          <button class="stats-toggle" onClick={() => setExpanded(!expanded)}>
            <div class="stats-summary">
              <Badge variant="soft" color="surface" size="sm" icon={BarChart3}>
                {stats.seen} / {stats.total} ({progressPercent}%)
              </Badge>
              <Badge variant="soft" color="surface" size="sm" icon={Flame}>
                {streak}
              </Badge>
            </div>
            <ChevronUp size={20} class={`toggle-icon ${expanded ? 'rotated' : ''}`} />
          </button>

          {needRefresh && (
            <Button variant="solid" color="success" icon={RefreshCw} size="sm" onClick={onUpdate} title={t('updateAvailable', language)}>
              {t('update', language)}
            </Button>
          )}
        </div>

        {expanded && (
          <div class="stats-details fade-in">
            <div class="stats-grid">
              <button class="stat-item clickable" onClick={() => setSelectedCategory('unseen')}>
                <div class="stat-icon unseen"><Eye size={16} /></div>
                <div class="stat-content">
                  <span class="stat-value">{stats.unseen}</span>
                  <span class="stat-label">{tr('unseen')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => setSelectedCategory('learning')}>
                <div class="stat-icon learning"><BookOpen size={16} /></div>
                <div class="stat-content">
                  <span class="stat-value">{stats.learning}</span>
                  <span class="stat-label">{tr('learning')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => setSelectedCategory('mastered')}>
                <div class="stat-icon mastered"><BarChart3 size={16} /></div>
                <div class="stat-content">
                  <span class="stat-value">{stats.mastered}</span>
                  <span class="stat-label">{tr('mastered')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => setSelectedCategory('difficult')}>
                <div class="stat-icon difficult"><AlertCircle size={16} /></div>
                <div class="stat-content">
                  <span class="stat-value">{stats.difficult}</span>
                  <span class="stat-label">{tr('difficult')}</span>
                </div>
              </button>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" style={{ width: `${progressPercent}%` }} />
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
