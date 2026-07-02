import { useState } from 'preact/hooks';
import { Button, Badge, Modal } from '../commons';
import { useLanguage } from '../../hooks';
import { useWritingContext } from './WritingProvider';

const ERROR_KEYS = {
  rate_limit: 'rateLimit',
  auth: 'auth',
  context_length: 'contextLength',
  network: 'network',
  aborted: 'unknown',
  unknown: 'unknown',
} as const;

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function WritingAssignmentView() {
  const { t, merge } = useLanguage();
  const {
    assignment, assignmentError, isGeneratingAssignment, startAssignment,
    draftText, setDraftText, submitWriting, isReviewing,
    reviewError, retryReview,
  } = useWritingContext();
  const [confirmingBelowMin, setConfirmingBelowMin] = useState(false);

  if (assignmentError) {
    return (
      <div class="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
        <p class="text-sm text-error">{t.chat.errors[ERROR_KEYS[assignmentError.kind]]}</p>
        <Button variant="solid" color="primary" onClick={startAssignment}>{t.writing.tryAgainButton}</Button>
      </div>
    );
  }

  if (!assignment || !assignment.scenario) {
    return (
      <div class="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
        <p class="text-sm text-text-muted">{t.writing.generatingAssignment}</p>
      </div>
    );
  }

  const minWords = assignment.minWords ?? 0;
  const count = wordCount(draftText);
  const belowMin = count < minWords;
  const isEmpty = count === 0;

  const handleSubmit = () => {
    if (belowMin) {
      setConfirmingBelowMin(true);
      return;
    }
    submitWriting();
  };

  const confirmSubmitAnyway = () => {
    setConfirmingBelowMin(false);
    submitWriting();
  };

  return (
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <div class="flex flex-col gap-3 p-4 bg-surface border border-border rounded-xl">
        <div class="flex items-center gap-2 flex-wrap">
          {assignment.format && <Badge color="primary">{assignment.format}</Badge>}
          {assignment.register && <Badge color="muted">{assignment.register}</Badge>}
        </div>
        <p class="text-sm text-text-primary leading-relaxed m-0">{assignment.scenario}</p>
        {assignment.requirements && assignment.requirements.length > 0 && (
          <ul class="list-disc pl-5 space-y-1 m-0">
            {assignment.requirements.map((req, i) => (
              <li key={i} class="text-sm text-text-secondary">{req}</li>
            ))}
          </ul>
        )}
      </div>

      {!isGeneratingAssignment && (
        <div class="flex flex-col gap-3">
          {reviewError && (
            <div class="flex flex-col gap-2 p-3 bg-error-light rounded-lg text-center">
              <p class="text-sm text-error m-0">{t.chat.errors[ERROR_KEYS[reviewError.kind]]}</p>
              <Button variant="solid" color="primary" onClick={retryReview}>{t.writing.tryAgainButton}</Button>
            </div>
          )}

          <textarea
            value={draftText}
            onInput={(e) => setDraftText((e.target as HTMLTextAreaElement).value)}
            disabled={isReviewing}
            class="min-h-40 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-[border-color] duration-(--transition-fast) disabled:opacity-50"
          />

          <div class="flex items-center justify-between gap-3">
            <span class={`text-xs ${belowMin ? 'text-error' : 'text-text-muted'}`}>
              {merge(t.writing.wordCounter, { count, min: minWords })}
            </span>
            <Button
              variant="solid"
              color="primary"
              disabled={isEmpty || isReviewing}
              onClick={handleSubmit}
            >
              {isReviewing ? t.writing.reviewingLabel : t.writing.submitButton}
            </Button>
          </div>
        </div>
      )}

      {confirmingBelowMin && (
        <Modal onClose={() => setConfirmingBelowMin(false)} maxWidth="sm">
          <Modal.Header title={t.writing.belowMinTitle} onClose={() => setConfirmingBelowMin(false)} />
          <Modal.Body>
            <p class="text-sm text-text-secondary m-0 mb-4">
              {merge(t.writing.belowMinBody, { count, min: minWords })}
            </p>
            <div class="flex gap-2 justify-end">
              <Button variant="outline" color="default" onClick={() => setConfirmingBelowMin(false)}>
                {t.common.close}
              </Button>
              <Button variant="solid" color="primary" onClick={confirmSubmitAnyway}>
                {t.writing.submitAnyway}
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
