import type { Quiz, QuizType, QuizMode, QuizOption, Language, Word } from '../types';
import { selectWord, generateOptions } from './wordSelector';
import { updateWordProgress, getSkillForQuizType } from './storage';
import { t } from '../data/translations';

export function createQuiz(quizType: QuizType, language: Language, mode: QuizMode = 'normal'): Quiz {
  // Pass the actual quizType for pinned word lookup, not the pool type
  const word = selectWord(quizType, mode);
  const tr = (key: string) => t(key, language);

  let question: Quiz['question'];
  let options: QuizOption[];
  let correctAnswer: string | number;

  switch (quizType) {
    case 'nativeToDutch':
      question = {
        text: word[language],
        subtext: tr('whatIsDutch'),
      };
      options = generateOptions(word, 'translation', language).map((w) => ({
        id: w.id,
        text: w.word,
        isCorrect: w.id === word.id,
      }));
      correctAnswer = word.id;
      break;

    case 'dutchToNative':
      question = {
        text: word.word,
        subtext: 'article' in word && word.article ? `(${word.article})` : undefined,
      };
      options = generateOptions(word, 'translation', language).map((w) => ({
        id: w.id,
        text: w[language],
        isCorrect: w.id === word.id,
      }));
      correctAnswer = word.id;
      break;

    case 'article':
      question = {
        text: word.word,
        subtext: tr('whatIsArticle'),
      };
      const wordArticle = 'article' in word ? word.article : null;
      options = [
        { id: 'de', text: 'de', isCorrect: wordArticle === 'de' },
        { id: 'het', text: 'het', isCorrect: wordArticle === 'het' },
      ];
      correctAnswer = wordArticle || 'de';
      break;

    default:
      throw new Error(`Unknown quiz type: ${quizType}`);
  }

  return {
    type: quizType,
    word,
    question,
    options,
    correctAnswer,
    answered: false,
    selectedAnswer: null,
    isCorrect: null,
  };
}

export function submitAnswer(quiz: Quiz, answerId: string | number): { isCorrect: boolean } {
  const isCorrect =
    quiz.type === 'article' ? answerId === quiz.correctAnswer : answerId === quiz.word.id;

  const skill = getSkillForQuizType(quiz.type);
  updateWordProgress(quiz.word.nl, skill, isCorrect);

  return { isCorrect };
}
