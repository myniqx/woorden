import { useState, useEffect } from 'preact/hooks';
import { useTheme, useLanguage } from './hooks';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { QuizScreen } from './components/QuizScreen';
import { InputQuizScreen } from './components/InputQuizScreen';
import { StatsFooter } from './components/StatsFooter';
import { SettingsModal } from './components/SettingsModal';
import { EditorPage } from './pages/EditorPage';

const INPUT_QUIZ_TYPES = ['nativeToDutch_write', 'verbForms'];
import type { QuizType, QuizMode, Screen } from './types';
import './styles/theme.css';
import './styles/app.css';

export function App() {
  // Check if we're on /editor route (dev only)
  const [isEditorRoute, setIsEditorRoute] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      const isEditor = window.location.pathname === '/editor';
      const isDev = import.meta.env.DEV;
      setIsEditorRoute(isEditor && isDev);
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Show editor page in dev mode
  if (isEditorRoute) {
    return <EditorPage />;
  }

  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [screen, setScreen] = useState<Screen>('menu');
  const [currentQuizType, setCurrentQuizType] = useState<QuizType | null>(null);
  const [currentQuizMode, setCurrentQuizMode] = useState<QuizMode>('normal');
  const [statsVersion, setStatsVersion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const startQuiz = (quizType: QuizType, mode: QuizMode = 'normal') => {
    setCurrentQuizType(quizType);
    setCurrentQuizMode(mode);
    setScreen('quiz');
  };

  const exitQuiz = () => {
    setCurrentQuizType(null);
    setScreen('menu');
  };

  const onStatsUpdate = () => {
    setStatsVersion(v => v + 1);
  };

  return (
    <div class="app">
      <Header
        key={`header-${statsVersion}`}
        theme={theme}
        language={language}
        onToggleTheme={toggleTheme}
        onLanguageChange={setLanguage}
        showBackButton={screen === 'quiz'}
        onBack={exitQuiz}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main class="main">
        {screen === 'menu' && (
          <MainMenu onStartQuiz={startQuiz} language={language} />
        )}

        {screen === 'quiz' && currentQuizType && (
          INPUT_QUIZ_TYPES.includes(currentQuizType) ? (
            <InputQuizScreen
              quizType={currentQuizType}
              quizMode={currentQuizMode}
              language={language}
              onExit={exitQuiz}
              onAnswer={onStatsUpdate}
            />
          ) : (
            <QuizScreen
              quizType={currentQuizType}
              quizMode={currentQuizMode}
              language={language}
              onExit={exitQuiz}
              onAnswer={onStatsUpdate}
            />
          )
        )}
      </main>

      <StatsFooter key={`footer-${statsVersion}`} language={language} quizType={currentQuizType} />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onDataImported={onStatsUpdate}
        onPacksChanged={onStatsUpdate}
      />
    </div>
  );
}
