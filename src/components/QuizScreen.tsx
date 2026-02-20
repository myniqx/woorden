import { useState, useEffect, useCallback } from 'preact/hooks';
import { Pin, Eye, Check, X, Flame } from 'lucide-preact';
import type { QuizType, QuizMode, Language, Quiz } from '../types';
import { createQuiz, submitAnswer } from '../services/quiz';
import { t } from '../data/translations';
import { canPinInQuizType, isPinned, togglePin, getSkillProgress, getSkillForQuizType } from '../services/storage';
import { OptionButton } from './OptionButton';
import './QuizScreen.css';

interface QuizScreenProps {
  quizType: QuizType;
  quizMode?: QuizMode;
  language: Language;
  onExit: () => void;
  onAnswer?: () => void;
}

export function QuizScreen({ quizType, quizMode = 'normal', language, onExit, onAnswer }: QuizScreenProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [pinned, setPinned] = useState(false);

  const tr = (key: string) => t(key, language);
  const canPin = canPinInQuizType(quizType);

  const loadNewQuestion = useCallback(() => {
    const newQuiz = createQuiz(quizType, language, quizMode);
    setQuiz(newQuiz);
    setSelectedId(null);
    setShowResult(false);
    // Check if this word is pinned
    if (canPinInQuizType(quizType)) {
      setPinned(isPinned(quizType, newQuiz.word.nl));
    }
  }, [quizType, language, quizMode]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const handleOptionSelect = (optionId: string | number) => {
    if (showResult || !quiz) return;

    setSelectedId(optionId);
    const result = submitAnswer(quiz, optionId);
    setShowResult(true);
    onAnswer?.();

    // Auto-advance after delay
    setTimeout(() => {
      loadNewQuestion();
    }, 1500);
  };

  const handlePinToggle = () => {
    if (!quiz || !canPin) return;
    const newPinned = togglePin(quizType, quiz.word.nl);
    setPinned(newPinned);
  };

  if (!quiz) {
    return <div class="quiz-loading">Loading...</div>;
  }

  return (
    <div class="quiz-screen fade-in">
      <div class="quiz-card">
        <div class="question-section">
          <span class="question-type">{t(`type_${quiz.word.type}`, language)}</span>
          {canPin && (
            <button
              class={`pin-button ${pinned ? 'pinned' : ''}`}
              onClick={handlePinToggle}
              aria-label={pinned ? 'Unpin word' : 'Pin word'}
            >
              <Pin size={18} />
            </button>
          )}
          <p class="question-text">{quiz.question.text}</p>
          {quiz.question.subtext && (
            <p class="question-subtext">{quiz.question.subtext}</p>
          )}
        </div>

        <div class="options-section">
          {quiz.options.map((option) => (
            <OptionButton
              key={option.id}
              option={option}
              selected={selectedId === option.id}
              showResult={showResult}
              onClick={() => handleOptionSelect(option.id)}
            />
          ))}
        </div>
      </div>

      {showResult && (() => {
        const isCorrect = quiz.options.find(o => o.id === selectedId)?.isCorrect;
        const skill = getSkillForQuizType(quizType);
        const progress = getSkillProgress(quiz.word.nl, skill);

        return (
          <div class={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div class="result-text">
              {isCorrect ? tr('correct') : `${tr('incorrect')} - ${quiz.word[language]}`}
            </div>
            <div class="result-stats">
              <span class="stat-item"><Eye size={14} /> {progress.seen}</span>
              <span class="stat-item correct"><Check size={14} /> {progress.correct}</span>
              <span class="stat-item incorrect"><X size={14} /> {progress.wrong}</span>
              <span class="stat-item streak"><Flame size={14} /> {progress.streak}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
