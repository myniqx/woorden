import { useState } from 'preact/hooks';
import { BarChart3, Eye, BookOpen, AlertCircle, ChevronUp, RefreshCw, Flame } from 'lucide-preact';
import type { Language, Word, WordStats, QuizType } from '../types';
import { words } from '../services/words';
import { getAllWordStats, getStreak } from '../services/storage';
import { getStatsSummary } from '../services/wordSelector';
import { t } from '../data/translations';
import { WordListModal } from './WordListModal';
import './StatsFooter.css';

interface StatsFooterProps {
  language: Language;
  quizType?: QuizType | null;
  needRefresh?: boolean;
  onUpdate?: () => void;
}

type Category = 'unseen' | 'learning' | 'mastered' | 'difficult';

interface WordWithStats extends Word {
  stats: WordStats;
}

function getCategorizedWords(language: Language): Record<Category, WordWithStats[]> {
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

  // Sort unseen alphabetically
  unseen.sort((a, b) => a.nl.localeCompare(b.nl, 'nl'));

  // Sort learning/difficult by most errors first
  learning.sort((a, b) => b.stats.wrong - b.stats.correct - (a.stats.wrong - a.stats.correct));
  difficult.sort((a, b) => b.stats.wrong - a.stats.wrong);

  // Sort mastered by most correct first
  mastered.sort((a, b) => b.stats.correct - a.stats.correct);

  return { unseen, learning, mastered, difficult };
}

export function StatsFooter({ language, quizType, needRefresh, onUpdate }: StatsFooterProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const stats = getStatsSummary(quizType || undefined);
  const streak = getStreak();
  const tr = (key: string) => t(key, language);
  const progressPercent = stats.total > 0 ? Math.round((stats.seen / stats.total) * 100) : 0;

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const categorizedWords = selectedCategory ? getCategorizedWords(language) : null;

  return (
    <>
      <footer class={`stats-footer ${expanded ? 'expanded' : ''}`}>
        <div class="stats-footer-row">
          <button class="stats-toggle" onClick={() => setExpanded(!expanded)}>
            <div class="stats-summary">
              <div class="stats-progress-badge">
                <BarChart3 size={14} />
                <span>{stats.seen} / {stats.total} ({progressPercent}%)</span>
              </div>
              <div class="stats-streak">
                <Flame size={14} />
                <span>{streak}</span>
              </div>
            </div>
            <ChevronUp size={20} class={`toggle-icon ${expanded ? 'rotated' : ''}`} />
          </button>

          {needRefresh && (
            <button class="update-btn" onClick={onUpdate} title={t('updateAvailable', language)}>
              <RefreshCw size={16} />
              <span>{t('update', language)}</span>
            </button>
          )}
        </div>

        {expanded && (
          <div class="stats-details fade-in">
            <div class="stats-grid">
              <button class="stat-item clickable" onClick={() => handleCategoryClick('unseen')}>
                <div class="stat-icon unseen">
                  <Eye size={16} />
                </div>
                <div class="stat-content">
                  <span class="stat-value">{stats.unseen}</span>
                  <span class="stat-label">{tr('unseen')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => handleCategoryClick('learning')}>
                <div class="stat-icon learning">
                  <BookOpen size={16} />
                </div>
                <div class="stat-content">
                  <span class="stat-value">{stats.learning}</span>
                  <span class="stat-label">{tr('learning')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => handleCategoryClick('mastered')}>
                <div class="stat-icon mastered">
                  <BarChart3 size={16} />
                </div>
                <div class="stat-content">
                  <span class="stat-value">{stats.mastered}</span>
                  <span class="stat-label">{tr('mastered')}</span>
                </div>
              </button>

              <button class="stat-item clickable" onClick={() => handleCategoryClick('difficult')}>
                <div class="stat-icon difficult">
                  <AlertCircle size={16} />
                </div>
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
          language={language}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}
