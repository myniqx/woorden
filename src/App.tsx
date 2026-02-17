import { useState } from 'preact/hooks';
import { useTheme, useLanguage } from './hooks';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { QuizScreen } from './components/QuizScreen';
import { StatsFooter } from './components/StatsFooter';
import type { QuizType, Screen } from './types';
import './styles/theme.css';
import './styles/app.css';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [screen, setScreen] = useState<Screen>('menu');
  const [currentQuizType, setCurrentQuizType] = useState<QuizType | null>(null);
  const [statsVersion, setStatsVersion] = useState(0);

  const startQuiz = (quizType: QuizType) => {
    setCurrentQuizType(quizType);
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
        onDataImported={onStatsUpdate}
      />

      <main class="main">
        {screen === 'menu' && (
          <MainMenu onStartQuiz={startQuiz} language={language} />
        )}

        {screen === 'quiz' && currentQuizType && (
          <QuizScreen
            quizType={currentQuizType}
            language={language}
            onExit={exitQuiz}
            onAnswer={onStatsUpdate}
          />
        )}
      </main>

      <StatsFooter key={`footer-${statsVersion}`} language={language} quizType={currentQuizType} />
    </div>
  );
}
