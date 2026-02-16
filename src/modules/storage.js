const STORAGE_KEY = 'woorden_app_data';

const defaultData = {
  language: 'tr',
  wordStats: {}, // { wordId: { seen: 0, correct: 0, wrong: 0, lastSeen: null } }
  dailyStats: {}, // { 'YYYY-MM-DD': { practiced: 0, correct: 0 } }
  streak: 0,
  lastPracticeDate: null
};

// Load data from localStorage
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultData, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return { ...defaultData };
}

// Save data to localStorage
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

// Get current app state
let appData = loadData();

// Language functions
export function getLanguage() {
  return appData.language;
}

export function setLanguage(lang) {
  appData.language = lang;
  saveData(appData);
}

// Word statistics functions
export function getWordStats(wordId) {
  return appData.wordStats[wordId] || { seen: 0, correct: 0, wrong: 0, lastSeen: null };
}

export function updateWordStats(wordId, isCorrect) {
  const stats = getWordStats(wordId);
  stats.seen++;
  if (isCorrect) {
    stats.correct++;
  } else {
    stats.wrong++;
  }
  stats.lastSeen = Date.now();
  appData.wordStats[wordId] = stats;

  // Update daily stats
  updateDailyStats(isCorrect);

  saveData(appData);
}

// Daily statistics
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function updateDailyStats(isCorrect) {
  const today = getTodayKey();

  if (!appData.dailyStats[today]) {
    appData.dailyStats[today] = { practiced: 0, correct: 0 };

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    if (appData.lastPracticeDate === yesterdayKey) {
      appData.streak++;
    } else if (appData.lastPracticeDate !== today) {
      appData.streak = 1;
    }

    appData.lastPracticeDate = today;
  }

  appData.dailyStats[today].practiced++;
  if (isCorrect) {
    appData.dailyStats[today].correct++;
  }
}

export function getDailyStats() {
  const today = getTodayKey();
  return appData.dailyStats[today] || { practiced: 0, correct: 0 };
}

export function getStreak() {
  return appData.streak;
}

// Get all word stats for analysis
export function getAllWordStats() {
  return appData.wordStats;
}

// Reset all data
export function resetData() {
  appData = { ...defaultData };
  saveData(appData);
}

export default {
  loadData,
  saveData,
  getLanguage,
  setLanguage,
  getWordStats,
  updateWordStats,
  getDailyStats,
  getStreak,
  getAllWordStats,
  resetData
};
