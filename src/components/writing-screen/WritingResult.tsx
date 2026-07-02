import { useState } from 'preact/hooks';
import { ChevronDown, ChevronRight } from 'lucide-preact';
import { Badge, Button } from '../commons';
import { useLanguage } from '../../hooks';
import { useWritingContext } from './WritingProvider';
import type { WritingAssignment, WritingReview } from './types';

function scoreColor(score: number): 'success' | 'primary' | 'error' {
  if (score >= 80) return 'success';
  if (score >= 50) return 'primary';
  return 'error';
}

interface ReviewBodyProps {
  review: Partial<WritingReview>;
  assignment?: Partial<WritingAssignment> | null;
  userText?: string;
}

function SubmissionAccordion({ assignment, userText }: { assignment?: Partial<WritingAssignment> | null; userText?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (!assignment?.scenario && !userText) return null;

  return (
    <div class="flex flex-col border border-border rounded-xl bg-surface">
      <button
        class="flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer text-left text-sm font-medium text-text-primary rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {t.writing.submissionTitle}
      </button>
      {open && (
        <div class="flex flex-col gap-3 px-4 pb-4">
          {assignment?.scenario && (
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-text-secondary uppercase tracking-wider">{t.writing.assignmentLabel}</span>
              <p class="text-sm text-text-primary leading-relaxed m-0">{assignment.scenario}</p>
            </div>
          )}
          {userText && (
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-text-secondary uppercase tracking-wider">{t.writing.yourTextLabel}</span>
              <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap m-0">{userText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewBody({ review, assignment, userText }: ReviewBodyProps) {
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

      <SubmissionAccordion assignment={assignment} userText={userText} />

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
  const { review, assignment, draftText, isReviewing, tryAgain, viewingEntry, closeViewing } = useWritingContext();

  if (viewingEntry) {
    return (
      <div class="flex flex-col flex-1 overflow-hidden">
        <ReviewBody review={viewingEntry.review} assignment={viewingEntry.assignment} userText={viewingEntry.userText} />
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
      <ReviewBody review={review} assignment={assignment} userText={draftText} />
      <div class="p-4 border-t border-border">
        <Button variant="solid" color="primary" fullWidth disabled={isReviewing} onClick={tryAgain}>
          {t.writing.tryAgainButton}
        </Button>
      </div>
    </div>
  );
}
