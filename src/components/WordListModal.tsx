import type { Word, WordStats } from '../types';
import { useLanguage } from '../hooks';
import { Modal } from './commons';

interface WordWithStats extends Word {
  stats: WordStats;
}

interface WordListModalProps {
  category: 'unseen' | 'learning' | 'mastered' | 'difficult';
  words: WordWithStats[];
  onClose: () => void;
}

export function WordListModal({ category, words, onClose }: WordListModalProps) {
  const { t } = useLanguage();

  const titles: Record<string, string> = {
    unseen: t.wordList.unseenWords,
    learning: t.wordList.learningWords,
    mastered: t.wordList.masteredWords,
    difficult: t.wordList.difficultWords,
  };

  return (
    <Modal onClose={onClose} maxWidth="lg">
      <Modal.Header title={`${titles[category]} (${words.length})`} onClose={onClose} />
      <Modal.Body>
        {words.length === 0 ? (
          <p class="text-center text-[var(--color-text-secondary)] py-[var(--spacing-xl)]">
            {t.wordList.emptyCategory}
          </p>
        ) : (
          <div class="flex flex-col gap-[var(--spacing-xs)]">
            {words.map((word) => (
              <div key={word.id} class="flex items-center justify-between px-[var(--spacing-md)] py-[var(--spacing-sm)] bg-[var(--color-bg)] rounded-[var(--radius-md)] gap-[var(--spacing-md)]">
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span class="font-medium text-[var(--color-text-primary)]">
                    {'article' in word && word.article && (
                      <span class="text-[var(--color-primary)] font-semibold">{word.article} </span>
                    )}
                    {word.nl}
                  </span>
                </div>
                {category !== 'unseen' && (
                  <div class="flex gap-[var(--spacing-sm)] shrink-0">
                    <span class="text-[var(--color-success)] text-[length:var(--text-sm)] font-medium">✓ {word.stats.correct}</span>
                    <span class="text-[var(--color-error)] text-[length:var(--text-sm)] font-medium">✗ {word.stats.wrong}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
