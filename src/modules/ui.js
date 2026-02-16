import { languages, words } from '../data/words.js';
import { t } from '../data/translations.js';
import { getLanguage, setLanguage, getDailyStats, getStreak, getWordStats, getAllWordStats } from './storage.js';
import { QUIZ_TYPES, createQuiz, submitAnswer, getQuizTypeInfo } from './quiz.js';
import { getStatsSummary } from './wordSelector.js';

// DOM Elements cache
const elements = {};

// Helper to get current language translation
const tr = (key, replacements) => t(key, getLanguage(), replacements);

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

  // Update HTML lang attribute for RTL and font support
  document.documentElement.lang = currentLang;

  elements.header.innerHTML = `
    <div class="header-content">
      <h1 class="logo">🇳🇱 Woorden</h1>
      <div class="header-right">
        <div class="streak-badge" title="${tr('streak')}">
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
      renderStats();
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
        <button class="back-btn" id="back-to-menu">${tr('back')}</button>
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
          ${tr('todayPracticed', { count: getDailyStats().practiced })}
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
  resultBadge.innerHTML = result.isCorrect ? tr('correct') : tr('wrong');
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
      <div class="stat-card clickable" data-category="unseen">
        <span class="stat-icon">📚</span>
        <span class="stat-value">${summary.unseen}</span>
        <span class="stat-label">${tr('unseen')}</span>
      </div>
      <div class="stat-card clickable" data-category="learning">
        <span class="stat-icon">📈</span>
        <span class="stat-value">${summary.learning + summary.difficult}</span>
        <span class="stat-label">${tr('learning')}</span>
      </div>
      <div class="stat-card clickable" data-category="mastered">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">${summary.mastered}</span>
        <span class="stat-label">${tr('mastered')}</span>
      </div>
    </div>

    <div class="today-stats">
      <h3>${tr('todayProgress')}</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(daily.practiced / 20 * 100, 100)}%"></div>
      </div>
      <div class="today-details">
        <span>${daily.practiced} / 20 ${tr('words')}</span>
        <span>%${accuracy} ${tr('accuracy')}</span>
        <span>🔥 ${streak} ${tr('daySeries')}</span>
      </div>
    </div>
  `;

  // Add click handlers for stat cards
  elements.statsContainer.querySelectorAll('.stat-card.clickable').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      showWordListModal(category);
    });
  });
}

// Get categorized words
function getCategorizedWords() {
  const allStats = getAllWordStats();
  const lang = getLanguage();

  const unseen = [];
  const learning = [];
  const mastered = [];

  words.forEach(word => {
    const stats = allStats[word.id] || { seen: 0, correct: 0, wrong: 0 };

    const wordData = {
      ...word,
      stats,
      translation: word[lang]
    };

    if (stats.seen === 0) {
      unseen.push(wordData);
    } else if (stats.correct >= 3 && stats.wrong === 0) {
      mastered.push(wordData);
    } else {
      learning.push(wordData);
    }
  });

  // Sort unseen alphabetically by Dutch word
  unseen.sort((a, b) => a.word.localeCompare(b.word, 'nl'));

  // Sort learning by most errors first
  learning.sort((a, b) => {
    const aErrorRate = a.stats.wrong - a.stats.correct;
    const bErrorRate = b.stats.wrong - b.stats.correct;
    return bErrorRate - aErrorRate;
  });

  // Sort mastered by most correct first
  mastered.sort((a, b) => b.stats.correct - a.stats.correct);

  return { unseen, learning, mastered };
}

// Show word list modal
function showWordListModal(category) {
  const categories = getCategorizedWords();
  const wordList = categories[category];

  const titles = {
    unseen: tr('unseenWords'),
    learning: tr('learningWords'),
    mastered: tr('masteredWords')
  };

  const descriptions = {
    unseen: tr('unseenDesc'),
    learning: tr('learningDesc'),
    mastered: tr('masteredDesc')
  };

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>${titles[category]}</h2>
          <p class="modal-description">${descriptions[category]}</p>
        </div>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        ${wordList.length === 0 ? `<p class="empty-message">${tr('emptyCategory')}</p>` : ''}
        <div class="word-list">
          ${wordList.map(word => `
            <div class="word-list-item">
              <div class="word-info">
                <span class="word-dutch">${word.nl}</span>
                <span class="word-translation">${word.translation}</span>
              </div>
              ${category !== 'unseen' ? `
                <div class="word-stats">
                  <span class="stat-correct">✓ ${word.stats.correct}</span>
                  <span class="stat-wrong">✗ ${word.stats.wrong}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  const closeModal = () => {
    modal.classList.add('closing');
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Animate in
  requestAnimationFrame(() => modal.classList.add('show'));
}

// Setup global event listeners
function setupEventListeners() {
  // Could add more global listeners here
}

export default {
  initUI,
  renderStats
};
