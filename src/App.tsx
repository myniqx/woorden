import { useState, useEffect, useRef } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { useThemeState, useLanguageState, ThemeContext, LanguageContext, useAppLayoutState, AppLayoutContext } from './hooks';
import { Header } from './components/Header';
import { MainMenu } from './components/main-menu';
import { QuizScreen, InputQuizScreen } from './components/quiz-screen';
import { StatsFooter } from './components/stats-footer';
import { EditorPage } from './pages/EditorPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ChangelogScreen, CHANGELOG_STORAGE_KEY } from './components/ChangelogScreen';
import { latestDate } from './data/changelog';
import { signInWithGoogle, signOut, onAuthStateChange } from './services/auth';
import type { User } from './services/auth';
import { pushStats } from './services/sync';
import { ProfileScreen } from './components/profile-screen';
import { AIChatScreen } from './components/ai-chat-screen';
import { AlertBanner } from './components/AlertBanner';

import type { QuizType, QuizMode, Screen } from './types';
const INPUT_QUIZ_TYPES = ['nativeToDutch_write', 'verbForms'];
const isFullscreen = (s: Screen) => s === 'ai-chat';
import './styles/theme.css';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleRoute = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  if (currentPath === '/editor' && import.meta.env.DEV) {
    return <EditorPage />;
  }

  if (currentPath === '/privacy') {
    return (
      <div class="app">
        <main class="main"><PrivacyPage /></main>
      </div>
    );
  }

  if (currentPath === '/terms') {
    return (
      <div class="app">
        <main class="main"><TermsPage /></main>
      </div>
    );
  }

  const themeValue = useThemeState();
  const languageValue = useLanguageState();
  const appLayoutValue = useAppLayoutState();
  const { currentScreen: screen, navigateTo } = appLayoutValue;

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [currentQuizType, setCurrentQuizType] = useState<QuizType | null>(null);
  const [currentQuizMode, setCurrentQuizMode] = useState<QuizMode>('normal');
  const [statsVersion, setStatsVersion] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const hasNewChangelog = (localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? '') < latestDate;
  const visitorTracked = useRef(false);

  useEffect(() => {
    return onAuthStateChange((u) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (visitorTracked.current) return;
    visitorTracked.current = true;

    const COUNTER_KEY = 'woorden-nl-app-visitors-2025';
    const COUNTER_API = 'https://countapi.mileshilliard.com/api/v1';
    const alreadyCounted = localStorage.getItem('visitor_counted');

    if (alreadyCounted) {
      fetch(`${COUNTER_API}/get/${COUNTER_KEY}`)
        .then(r => r.json())
        .then(data => setVisitorCount(data.value))
        .catch(() => { });
    } else {
      fetch(`${COUNTER_API}/hit/${COUNTER_KEY}`)
        .then(r => r.json())
        .then(data => {
          localStorage.setItem('visitor_counted', '1');
          setVisitorCount(data.value);
        })
        .catch(() => { });
    }
  }, []);

  useEffect(() => {
    history.replaceState({ screen: 'menu' }, '');

    const handlePopState = (e: PopStateEvent) => {
      const target: Screen = e.state?.screen ?? 'menu';
      if (target !== 'quiz') setCurrentQuizType(null);
      navigateTo(target);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const startQuiz = (quizType: QuizType, mode: QuizMode = 'normal') => {
    history.pushState({ screen: 'quiz' }, '');
    setCurrentQuizType(quizType);
    setCurrentQuizMode(mode);
    navigateTo('quiz');
  };

  const exitQuiz = () => {
    if (user) pushStats(user).catch(() => { });
    history.back();
  };

  const onStatsUpdate = () => {
    setStatsVersion(v => v + 1);
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageContext.Provider value={languageValue}>
      <AppLayoutContext.Provider value={appLayoutValue}>
        <div class="app">
          <Header
            key={`header-${statsVersion}`}
            showBackButton={screen === 'quiz' || screen === 'changelog' || screen === 'profile' || screen === 'ai-chat'}
            onBack={screen === 'changelog' || screen === 'profile' || screen === 'ai-chat' ? () => history.back() : exitQuiz}
            onProfileClick={() => { history.pushState({ screen: 'profile' }, ''); navigateTo('profile'); }}
            user={user}
          />

          <main class="main" data-fullscreen={isFullscreen(screen) || undefined}>
            {screen === 'menu' && <AlertBanner />}

            {screen === 'menu' && (
              <MainMenu
                onStartQuiz={startQuiz}
                onOpenChangelog={() => {
                  history.pushState({ screen: 'changelog' }, '');
                  navigateTo('changelog');
                }}
                onOpenAIChat={() => {
                  history.pushState({ screen: 'ai-chat' }, '');
                  navigateTo('ai-chat');
                }}
                hasNewChangelog={hasNewChangelog}
              />
            )}

            {screen === 'changelog' && (
              <ChangelogScreen />
            )}

            {screen === 'profile' && (
              <ProfileScreen
                visitorCount={visitorCount}
                user={user}
                onSignIn={signInWithGoogle}
                onSignOut={signOut}
                onDataImported={onStatsUpdate}
              />
            )}

            {screen === 'ai-chat' && <AIChatScreen />}

            {screen === 'quiz' && currentQuizType && (
              INPUT_QUIZ_TYPES.includes(currentQuizType) ? (
                <InputQuizScreen
                  quizType={currentQuizType}
                  quizMode={currentQuizMode}
                  onAnswer={onStatsUpdate}
                />
              ) : (
                <QuizScreen
                  quizType={currentQuizType}
                  quizMode={currentQuizMode}
                  onAnswer={onStatsUpdate}
                />
              )
            )}
          </main>

          {!isFullscreen(screen) && (
            <StatsFooter
              key={`footer-${statsVersion}`}
              quizType={currentQuizType}
              needRefresh={needRefresh}
              onUpdate={() => updateServiceWorker(true)}
            />
          )}
        </div>
      </AppLayoutContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}
