import { Badge, Button } from '../commons';
import { useLanguage } from '../../hooks';
import { useWritingContext } from './WritingProvider';
import type { WritingReview } from './types';

function scoreColor(score: number): 'success' | 'primary' | 'error' {
  if (score >= 80) return 'success';
  if (score >= 50) return 'primary';
  return 'error';
}

interface ReviewBodyProps {
  review: Partial<WritingReview>;
}

function ReviewBody({ review }: ReviewBodyProps) {
  const { t } = useLanguage();

  return (
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {review.scores && (
        <div class="flex flex-col gap-3 p-4 bg-surface border border-border rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-3xl font-bold text-text-primary">{review.scores.overall}%</span>
            {review.estimatedLevel && (
              <Badge color="primary" size="md">{t.writing.estimatedLevelLabel}: {review.estimatedLevel}</Badge>
            )}
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col items-center gap-1">
              <Badge color={scoreColor(review.scores.grammar)} size="sm">{review.scores.grammar}%</Badge>
              <span class="text-xs text-text-muted">{t.writing.scoreGrammar}</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <Badge color={scoreColor(review.scores.spelling)} size="sm">{review.scores.spelling}%</Badge>
              <span class="text-xs text-text-muted">{t.writing.scoreSpelling}</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <Badge color={scoreColor(review.scores.vocabulary)} size="sm">{review.scores.vocabulary}%</Badge>
              <span class="text-xs text-text-muted">{t.writing.scoreVocabulary}</span>
            </div>
          </div>
        </div>
      )}

      {review.overallComment && (
        <p class="text-sm text-text-primary leading-relaxed m-0">{review.overallComment}</p>
      )}

      {review.analysis && (
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-text-primary m-0">{t.writing.analysisTitle}</h3>
          <ul class="list-disc pl-5 space-y-1.5 m-0">
            {review.analysis.grammar && <li class="text-sm text-text-secondary">{review.analysis.grammar}</li>}
            {review.analysis.sentenceStructure && <li class="text-sm text-text-secondary">{review.analysis.sentenceStructure}</li>}
            {review.analysis.wordChoice && <li class="text-sm text-text-secondary">{review.analysis.wordChoice}</li>}
          </ul>
        </div>
      )}

      {review.corrections && review.corrections.length > 0 && (
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-text-primary m-0">{t.writing.correctionsTitle}</h3>
          <div class="flex flex-col gap-2">
            {review.corrections.map((c, i) => (
              <div key={i} class="flex flex-col gap-1 p-3 bg-surface-elevated rounded-lg text-sm">
                <span class="text-error line-through decoration-error/60">{c.quote}</span>
                <span class="text-success font-medium">{c.correction}</span>
                <span class="text-text-secondary text-xs">{c.explanation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {review.improvementTip && (
        <div class="px-3 py-2 border-l-2 border-primary bg-primary-light rounded-r-md text-sm text-text-primary">
          {review.improvementTip}
        </div>
      )}

      {review.vocabulary && review.vocabulary.length > 0 && (
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-text-primary m-0">{t.writing.vocabularyTitle}</h3>
          <div class="flex flex-wrap gap-2">
            {review.vocabulary.map((v, i) => (
              <Badge key={i} color="surface" size="md">
                <strong>{v.word}</strong>&nbsp;— {v.translation}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WritingResult() {
  const { t } = useLanguage();
  const { review, isReviewing, tryAgain, viewingEntry, closeViewing } = useWritingContext();

  if (viewingEntry) {
    return (
      <div class="flex flex-col flex-1 overflow-hidden">
        <ReviewBody review={viewingEntry.review} />
        <div class="p-4 border-t border-border">
          <Button variant="outline" color="default" fullWidth onClick={closeViewing}>
            {t.writing.backToSetup}
          </Button>
        </div>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div class="flex flex-col flex-1 overflow-hidden">
      <ReviewBody review={review} />
      <div class="p-4 border-t border-border">
        <Button variant="solid" color="primary" fullWidth disabled={isReviewing} onClick={tryAgain}>
          {t.writing.tryAgainButton}
        </Button>
      </div>
    </div>
  );
}
