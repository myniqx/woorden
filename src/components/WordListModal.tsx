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
          <p class="text-center text-text-secondary py-8">
            {t.wordList.emptyCategory}
          </p>
        ) : (
          <div class="flex flex-col gap-1">
            {words.map((word) => (
              <div key={word.id} class="flex items-center justify-between px-4 py-2 bg-bg rounded-md gap-4">
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span class="font-medium text-text-primary">
                    {'article' in word && word.article && (
                      <span class="text-primary font-semibold">{word.article} </span>
                    )}
                    {word.nl}
                  </span>
                </div>
                {category !== 'unseen' && (
                  <div class="flex gap-2 shrink-0">
                    <span class="text-success text-sm font-medium">✓ {word.stats.correct}</span>
                    <span class="text-error text-sm font-medium">✗ {word.stats.wrong}</span>
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
