import { languages } from '../data/words.js';
import { getLanguage, setLanguage, getDailyStats, getStreak } from './storage.js';
import { QUIZ_TYPES, createQuiz, submitAnswer, getQuizTypeInfo } from './quiz.js';
import { getStatsSummary } from './wordSelector.js';

// DOM Elements cache
const elements = {};

// Initialize UI
export function initUI() {
  cacheElements();
  renderHeader();
  renderQuizTypeSelector();
  renderStats();
  setupEventListeners();
}

function cacheElements() {
  elements.app = document.getElementById('app');
  elements.header = document.getElementById('header');
  elements.languageSelector = document.getElementById('language-selector');
  elements.quizTypeContainer = document.getElementById('quiz-type-container');
  elements.quizContainer = document.getElementById('quiz-container');
  elements.statsContainer = document.getElementById('stats-container');
}

// Render header with language selector
function renderHeader() {
  const currentLang = getLanguage();
  const currentLangData = languages.find(l => l.code === currentLang);

  elements.header.innerHTML = `
    <div class="header-content">
      <h1 class="logo">🇳🇱 Woorden</h1>
      <div class="header-right">
        <div class="streak-badge" title="Günlük seri">
          🔥 ${getStreak()}
        </div>
        <div class="language-dropdown">
          <button class="language-btn" id="lang-toggle">
            ${currentLangData.flag} ${currentLangData.name}
            <span class="arrow">▼</span>
          </button>
          <div class="language-menu" id="lang-menu">
            ${languages.map(lang => `
              <button class="language-option ${lang.code === currentLang ? 'active' : ''}"
                      data-lang="${lang.code}">
                ${lang.flag} ${lang.name}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Language dropdown toggle
  const langToggle = document.getElementById('lang-toggle');
  const langMenu = document.getElementById('lang-menu');

  langToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    langMenu.classList.remove('show');
  });

  // Language selection
  langMenu.querySelectorAll('.language-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = e.target.dataset.lang;
      setLanguage(lang);
      renderHeader();
      renderQuizTypeSelector();
    });
  });
}

// Render quiz type selector
function renderQuizTypeSelector() {
  const quizTypes = [
    QUIZ_TYPES.NATIVE_TO_DUTCH,
    QUIZ_TYPES.DUTCH_TO_NATIVE,
    QUIZ_TYPES.ARTICLE
  ];

  elements.quizTypeContainer.innerHTML = `
    <div class="quiz-type-grid">
      ${quizTypes.map(type => {
        const info = getQuizTypeInfo(type);
        return `
          <button class="quiz-type-card" data-quiz-type="${type}">
            <span class="quiz-type-icon">${info.icon}</span>
            <span class="quiz-type-name">${info.name}</span>
            <span class="quiz-type-desc">${info.description}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  // Quiz type selection
  elements.quizTypeContainer.querySelectorAll('.quiz-type-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const quizType = e.currentTarget.dataset.quizType;
      startQuiz(quizType);
    });
  });
}

// Start a quiz
function startQuiz(quizType) {
  const quiz = createQuiz(quizType);
  renderQuiz(quiz);
}

// Render current quiz
function renderQuiz(quiz) {
  const info = getQuizTypeInfo(quiz.type);

  elements.quizContainer.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-header">
        <button class="back-btn" id="back-to-menu">← Geri</button>
        <span class="quiz-type-badge">${info.icon} ${info.name}</span>
      </div>

      <div class="question-section">
        <h2 class="question-text">${quiz.question.text}</h2>
        ${quiz.question.subtext ? `<p class="question-subtext">${quiz.question.subtext}</p>` : ''}
      </div>

      <div class="options-container ${quiz.type === QUIZ_TYPES.ARTICLE ? 'article-options' : ''}">
        ${quiz.options.map((option, index) => `
          <button class="option-btn" data-option-id="${option.id}" data-index="${index}">
            <span class="option-key">${index + 1}</span>
            <span class="option-text">${option.text}</span>
          </button>
        `).join('')}
      </div>

      <div class="quiz-footer">
        <div class="daily-progress">
          Bugün: ${getDailyStats().practiced} kelime çalışıldı
        </div>
      </div>
    </div>
  `;

  // Back button
  document.getElementById('back-to-menu').addEventListener('click', () => {
    elements.quizContainer.innerHTML = '';
    renderStats();
  });

  // Option buttons
  elements.quizContainer.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const optionId = e.currentTarget.dataset.optionId;
      // Convert to number if it's a word ID, keep string for article
      const answerId = quiz.type === QUIZ_TYPES.ARTICLE ? optionId : parseInt(optionId);
      handleAnswer(answerId, quiz.type);
    });
  });

  // Keyboard shortcuts
  const keyHandler = (e) => {
    const key = parseInt(e.key);
    if (key >= 1 && key <= quiz.options.length) {
      const btn = elements.quizContainer.querySelector(`[data-index="${key - 1}"]`);
      if (btn && !btn.disabled) {
        btn.click();
      }
    }
  };
  document.addEventListener('keydown', keyHandler);

  // Store handler for cleanup
  elements.quizContainer.dataset.keyHandler = 'active';
  elements.quizContainer._keyHandler = keyHandler;
}

// Handle answer submission
function handleAnswer(answerId, quizType) {
  const result = submitAnswer(answerId);
  if (!result) return;

  // Remove keyboard handler
  if (elements.quizContainer._keyHandler) {
    document.removeEventListener('keydown', elements.quizContainer._keyHandler);
  }

  // Mark options as correct/wrong
  const options = elements.quizContainer.querySelectorAll('.option-btn');
  options.forEach(btn => {
    btn.disabled = true;
    const optionId = quizType === QUIZ_TYPES.ARTICLE
      ? btn.dataset.optionId
      : parseInt(btn.dataset.optionId);

    if (quizType === QUIZ_TYPES.ARTICLE) {
      if (optionId === result.correctAnswer) {
        btn.classList.add('correct');
      } else if (optionId === answerId) {
        btn.classList.add('wrong');
      }
    } else {
      if (optionId === result.word.id) {
        btn.classList.add('correct');
      } else if (optionId === answerId) {
        btn.classList.add('wrong');
      }
    }
  });

  // Show result animation
  const questionSection = elements.quizContainer.querySelector('.question-section');
  const resultBadge = document.createElement('div');
  resultBadge.className = `result-badge ${result.isCorrect ? 'correct' : 'wrong'}`;
  resultBadge.innerHTML = result.isCorrect ? '✓ Doğru!' : '✗ Yanlış';
  questionSection.appendChild(resultBadge);

  // Show word details if wrong
  if (!result.isCorrect) {
    const details = document.createElement('div');
    details.className = 'word-details';
    const lang = getLanguage();
    details.innerHTML = `
      <p><strong>${result.word.nl}</strong></p>
      <p>${result.word[lang]}</p>
    `;
    questionSection.appendChild(details);
  }

  // Auto-advance to next question after delay
  setTimeout(() => {
    startQuiz(quizType);
    renderStats();
  }, result.isCorrect ? 1000 : 2000);
}

// Render statistics
function renderStats() {
  const daily = getDailyStats();
  const summary = getStatsSummary();
  const streak = getStreak();

  const accuracy = daily.practiced > 0
    ? Math.round((daily.correct / daily.practiced) * 100)
    : 0;

  elements.statsContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">📚</span>
        <span class="stat-value">${summary.totalWords}</span>
        <span class="stat-label">Toplam Kelime</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👁️</span>
        <span class="stat-value">${summary.seen}</span>
        <span class="stat-label">Görülen</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">${summary.mastered}</span>
        <span class="stat-label">Öğrenilen</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📈</span>
        <span class="stat-value">${summary.learning}</span>
        <span class="stat-label">Öğreniliyor</span>
      </div>
    </div>

    <div class="today-stats">
      <h3>Bugünkü İlerleme</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(daily.practiced / 20 * 100, 100)}%"></div>
      </div>
      <div class="today-details">
        <span>${daily.practiced} / 20 kelime</span>
        <span>%${accuracy} doğruluk</span>
        <span>🔥 ${streak} gün seri</span>
      </div>
    </div>
  `;
}

// Setup global event listeners
function setupEventListeners() {
  // Could add more global listeners here
}

export default {
  initUI,
  renderStats
};
