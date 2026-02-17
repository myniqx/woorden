import { useState, useEffect, useCallback } from 'preact/hooks';
import type { QuizType, Language, Quiz } from '../types';
import { createQuiz, submitAnswer } from '../services/quiz';
import { t } from '../data/translations';
import { OptionButton } from './OptionButton';
import './QuizScreen.css';

interface QuizScreenProps {
  quizType: QuizType;
  language: Language;
  onExit: () => void;
  onAnswer?: () => void;
}

export function QuizScreen({ quizType, language, onExit, onAnswer }: QuizScreenProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const tr = (key: string) => t(key, language);

  const loadNewQuestion = useCallback(() => {
    const newQuiz = createQuiz(quizType, language);
    setQuiz(newQuiz);
    setSelectedId(null);
    setShowResult(false);
  }, [quizType, language]);

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

  if (!quiz) {
    return <div class="quiz-loading">Loading...</div>;
  }

  return (
    <div class="quiz-screen fade-in">
      <div class="quiz-card">
        <div class="question-section">
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

      {showResult && (
        <div class={`result-banner ${quiz.options.find(o => o.id === selectedId)?.isCorrect ? 'correct' : 'incorrect'}`}>
          {quiz.options.find(o => o.id === selectedId)?.isCorrect
            ? tr('correct')
            : `${tr('incorrect')} - ${quiz.word[language]}`}
        </div>
      )}
    </div>
  );
}
