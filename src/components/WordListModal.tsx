import { X } from 'lucide-preact';
import type { Word, WordStats } from '../types';
import { t } from '../data/translations';
import { useLanguage } from '../hooks';
import { Button } from './commons';
import './WordListModal.css';

interface WordWithStats extends Word {
  stats: WordStats;
}

interface WordListModalProps {
  category: 'unseen' | 'learning' | 'mastered' | 'difficult';
  words: WordWithStats[];
  onClose: () => void;
}

export function WordListModal({ category, words, onClose }: WordListModalProps) {
  const { language } = useLanguage();
  const tr = (key: string) => t(key, language);

  const titles: Record<string, string> = {
    unseen: tr('unseenWords'),
    learning: tr('learningWords'),
    mastered: tr('masteredWords'),
    difficult: tr('difficultWords'),
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      onClose();
    }
  };

  return (
    <div class="modal-overlay" onClick={handleOverlayClick}>
      <div class="modal-content scale-in">
        <div class="modal-header">
          <h2 class="modal-title">{titles[category]} ({words.length})</h2>
          <Button variant="ghost" icon={X} size="icon" onClick={onClose} aria-label="Close" />
        </div>

        <div class="modal-body">
          {words.length === 0 ? (
            <p class="empty-message">{tr('emptyCategory')}</p>
          ) : (
            <div class="word-list">
              {words.map((word) => (
                <div key={word.id} class="word-list-item">
                  <div class="word-info">
                    <span class="word-dutch">
                      {'article' in word && word.article && (
                        <span class="word-article">{word.article} </span>
                      )}
                      {word.nl}
                    </span>
                    <span class="word-translation">{word[language]}</span>
                  </div>
                  {category !== 'unseen' && (
                    <div class="word-stats">
                      <span class="stat-correct">✓ {word.stats.correct}</span>
                      <span class="stat-wrong">✗ {word.stats.wrong}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
