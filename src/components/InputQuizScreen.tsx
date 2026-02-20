import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { Pin, Eye, Check, X, Flame } from 'lucide-preact';
import type { QuizType, QuizMode, Language } from '../types';
import { t } from '../data/translations';
import {
  canPinInQuizType,
  isPinned,
  togglePin,
  getSkillProgress,
  getSkillForQuizType,
  updateWordProgress,
} from '../services/storage';
import { selectWord } from '../services/wordSelector';
import { words } from '../services/words';
import { compareIgnoringAccents } from '../utils/textUtils';
import './InputQuizScreen.css';

interface InputQuizScreenProps {
  quizType: QuizType;
  quizMode?: QuizMode;
  language: Language;
  onExit: () => void;
  onAnswer?: () => void;
}

interface QuizState {
  wordNl: string;
  wordType: string;
  questionText: string;
  subtext: string;
  correctAnswer: string;
  perfectum?: string;
  imperfectum?: string;
}

export function InputQuizScreen({
  quizType,
  quizMode = 'normal',
  language,
  onExit,
  onAnswer,
}: InputQuizScreenProps) {
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [pinned, setPinned] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canPin = canPinInQuizType(quizType);

  const loadNewQuestion = useCallback(() => {
    let word;
    let questionText: string;
    let subtext: string;
    let correctAnswer: string;

    if (quizType === 'verbForms') {
      // Select a verb
      word = selectWord('verbForms', quizMode);

      // Randomly choose perfectum or imperfectum
      const askPerfectum = Math.random() > 0.5;

      if (askPerfectum && 'perfectum' in word) {
        correctAnswer = word.perfectum;
        subtext = t('writeThePerfectum', language);
      } else if ('imperfectum' in word) {
        correctAnswer = word.imperfectum;
        subtext = t('writeTheImperfectum', language);
      } else {
        // Fallback
        correctAnswer = word.nl;
        subtext = '';
      }

      questionText = word.nl;
    } else {
      // nativeToDutch_write
      word = selectWord('nativeToDutch_write', quizMode);
      questionText = word[language];
      subtext = t('writeTheDutch', language);
      correctAnswer = word.nl;
    }

    setQuiz({
      wordNl: word.nl,
      wordType: word.type,
      questionText,
      subtext,
      correctAnswer,
      perfectum: 'perfectum' in word ? word.perfectum : undefined,
      imperfectum: 'imperfectum' in word ? word.imperfectum : undefined,
    });
    setInputValue('');
    setShowResult(false);
    setIsCorrect(false);
    setSkipped(false);

    if (canPinInQuizType(quizType)) {
      setPinned(isPinned(quizType, word.nl));
    }

    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [quizType, quizMode, language]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  // Check answer on each keystroke
  useEffect(() => {
    if (!quiz || showResult) return;

    if (compareIgnoringAccents(inputValue, quiz.correctAnswer)) {
      // Correct answer!
      setIsCorrect(true);
      setShowResult(true);

      const skill = getSkillForQuizType(quizType);
      updateWordProgress(quiz.wordNl, skill, true);
      onAnswer?.();

      // Auto-advance after delay
      setTimeout(() => {
        loadNewQuestion();
      }, 1500);
    }
  }, [inputValue, quiz, showResult, quizType, loadNewQuestion, onAnswer]);

  const handleSkip = () => {
    if (!quiz || showResult) return;

    setSkipped(true);
    setIsCorrect(false);
    setShowResult(true);

    const skill = getSkillForQuizType(quizType);
    updateWordProgress(quiz.wordNl, skill, false);
    onAnswer?.();

    // Auto-advance after delay
    setTimeout(() => {
      loadNewQuestion();
    }, 2000);
  };

  const handlePinToggle = () => {
    if (!quiz || !canPin) return;
    const newPinned = togglePin(quizType, quiz.wordNl);
    setPinned(newPinned);
  };

  if (!quiz) {
    return <div class="quiz-loading">Loading...</div>;
  }

  const skill = getSkillForQuizType(quizType);
  const progress = getSkillProgress(quiz.wordNl, skill);

  return (
    <div class="input-quiz-screen fade-in">
      <div class="quiz-card">
        <div class="question-section">
          <span class="question-type">{t(`type_${quiz.wordType}`, language)}</span>
          {canPin && (
            <button
              class={`pin-button ${pinned ? 'pinned' : ''}`}
              onClick={handlePinToggle}
              aria-label={pinned ? 'Unpin word' : 'Pin word'}
            >
              <Pin size={18} />
            </button>
          )}
          <p class="question-text">{quiz.questionText}</p>
          {quiz.subtext && <p class="question-subtext">{quiz.subtext}</p>}
        </div>

        <div class="input-section">
          <input
            ref={inputRef}
            type="text"
            class={`answer-input ${showResult ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
            value={inputValue}
            onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            disabled={showResult}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {!showResult && (
            <button class="skip-button" onClick={handleSkip}>
              {t('skip', language)}
            </button>
          )}
        </div>
      </div>

      {showResult && (
        <div class={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div class="result-text">
            {isCorrect
              ? t('correct', language)
              : t('correctAnswer', language, { answer: quiz.correctAnswer })}
          </div>
          <div class="result-stats">
            <span class="stat-item">
              <Eye size={14} /> {progress.seen}
            </span>
            <span class="stat-item correct">
              <Check size={14} /> {progress.correct}
            </span>
            <span class="stat-item incorrect">
              <X size={14} /> {progress.wrong}
            </span>
            <span class="stat-item streak">
              <Flame size={14} /> {progress.streak}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
