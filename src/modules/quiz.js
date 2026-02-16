import { selectWord, generateOptions } from './wordSelector.js';
import { getLanguage, updateWordStats } from './storage.js';
import { t } from '../data/translations.js';

// Quiz types
export const QUIZ_TYPES = {
  NATIVE_TO_DUTCH: 'nativeToDutch', // Show native language, pick Dutch
  DUTCH_TO_NATIVE: 'dutchToNative', // Show Dutch, pick native language
  ARTICLE: 'article' // Show word, pick de/het
};

// Current quiz state
let currentQuiz = null;

// Helper for translations
const tr = (key) => t(key, getLanguage());

// Create a new quiz question
export function createQuiz(quizType) {
  const language = getLanguage();
  const word = selectWord(quizType === QUIZ_TYPES.ARTICLE ? 'article' : 'translation');

  let question, options, correctAnswer;

  switch (quizType) {
    case QUIZ_TYPES.NATIVE_TO_DUTCH:
      // Question: translation in user's language
      // Options: Dutch words
      question = {
        text: word[language],
        subtext: tr('whatIsDutch')
      };
      options = generateOptions(word, 'translation', language).map(w => ({
        id: w.id,
        text: w.word,
        isCorrect: w.id === word.id
      }));
      correctAnswer = word.id;
      break;

    case QUIZ_TYPES.DUTCH_TO_NATIVE:
      // Question: Dutch word
      // Options: translations in user's language
      question = {
        text: word.word,
        subtext: word.article ? `(${word.article})` : '',
        fullText: word.nl
      };
      options = generateOptions(word, 'translation', language).map(w => ({
        id: w.id,
        text: w[language],
        isCorrect: w.id === word.id
      }));
      correctAnswer = word.id;
      break;

    case QUIZ_TYPES.ARTICLE:
      // Question: Dutch word without article
      // Options: de / het
      question = {
        text: word.word,
        subtext: tr('whatIsArticle')
      };
      options = [
        { id: 'de', text: 'de', isCorrect: word.article === 'de' },
        { id: 'het', text: 'het', isCorrect: word.article === 'het' }
      ];
      correctAnswer = word.article;
      break;

    default:
      throw new Error(`Unknown quiz type: ${quizType}`);
  }

  currentQuiz = {
    type: quizType,
    word,
    question,
    options,
    correctAnswer,
    answered: false,
    selectedAnswer: null,
    isCorrect: null
  };

  return currentQuiz;
}

// Submit an answer
export function submitAnswer(answerId) {
  if (!currentQuiz || currentQuiz.answered) {
    return null;
  }

  currentQuiz.answered = true;
  currentQuiz.selectedAnswer = answerId;

  // Check if correct
  if (currentQuiz.type === QUIZ_TYPES.ARTICLE) {
    currentQuiz.isCorrect = answerId === currentQuiz.correctAnswer;
  } else {
    currentQuiz.isCorrect = answerId === currentQuiz.word.id;
  }

  // Update statistics
  updateWordStats(currentQuiz.word.id, currentQuiz.isCorrect);

  return {
    isCorrect: currentQuiz.isCorrect,
    correctAnswer: currentQuiz.correctAnswer,
    word: currentQuiz.word
  };
}

// Get current quiz state
export function getCurrentQuiz() {
  return currentQuiz;
}

// Get quiz type display info
export function getQuizTypeInfo(quizType) {
  const language = getLanguage();

  switch (quizType) {
    case QUIZ_TYPES.NATIVE_TO_DUTCH:
      return {
        name: tr('quizNativeToDutch'),
        icon: '🎯',
        description: tr('quizNativeToDutchDesc')
      };
    case QUIZ_TYPES.DUTCH_TO_NATIVE:
      return {
        name: tr('quizDutchToNative'),
        icon: '📖',
        description: tr('quizDutchToNativeDesc')
      };
    case QUIZ_TYPES.ARTICLE:
      return {
        name: tr('quizArticle'),
        icon: '📝',
        description: tr('quizArticleDesc')
      };
    default:
      return { name: 'Quiz', icon: '❓', description: '' };
  }
}

export default {
  QUIZ_TYPES,
  createQuiz,
  submitAnswer,
  getCurrentQuiz,
  getQuizTypeInfo
};
