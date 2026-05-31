import { useState, useEffect, useRef } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { useTheme, useLanguage } from './hooks';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { QuizScreen } from './components/QuizScreen';
import { InputQuizScreen } from './components/InputQuizScreen';
import { StatsFooter } from './components/StatsFooter';
import { SettingsModal } from './components/SettingsModal';
import { EditorPage } from './pages/EditorPage';
import { ChangelogScreen, CHANGELOG_STORAGE_KEY } from './components/ChangelogScreen';
import { latestDate } from './data/changelog';
import { signInWithGoogle, signOut, onAuthStateChange } from './services/auth';
import type { User } from './services/auth';
import { setCurrentUser, loadRemoteData, mergeRemoteData, getExportData, getStoredUid, setStoredUid } from './services/storage';
import { pullProgress, pushProgress } from './services/sync';

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

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [screen, setScreen] = useState<Screen>('menu');
  const [currentQuizType, setCurrentQuizType] = useState<QuizType | null>(null);
  const [currentQuizMode, setCurrentQuizMode] = useState<QuizMode>('normal');
  const [statsVersion, setStatsVersion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const hasNewChangelog = (localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? '') < latestDate;
  const visitorTracked = useRef(false);

  useEffect(() => {
    return onAuthStateChange(async (u) => {
      setUser(u);
      setCurrentUser(u);

      if (!u) return;

      const storedUid = getStoredUid();
      const remote = await pullProgress(u);

      if (!storedUid) {
        // Eski kullanıcı veya ilk giriş
        if (!remote) {
          // Senaryo 1: Supabase boş → local'i push et
          setStoredUid(u.id);
          await pushProgress(u, getExportData());
        } else {
          // Senaryo 2: Supabase'de veri var → merge et
          setStoredUid(u.id);
          mergeRemoteData(remote);
          await pushProgress(u, getExportData());
          setStatsVersion(v => v + 1);
        }
      } else if (storedUid !== u.id) {
        // Senaryo 3: Farklı kullanıcı → local'i ez
        setStoredUid(u.id);
        if (remote) {
          loadRemoteData(remote);
          setStatsVersion(v => v + 1);
        }
      } else {
        // Senaryo 4: Aynı kullanıcı → her yeni sayfa açılışında bir kez merge et
        const syncedThisSession = sessionStorage.getItem('woorden_synced');
        if (!syncedThisSession && remote) {
          sessionStorage.setItem('woorden_synced', '1');
          mergeRemoteData(remote);
          await pushProgress(u, getExportData());
          setStatsVersion(v => v + 1);
        }
      }
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
        .catch(() => {});
    } else {
      fetch(`${COUNTER_API}/hit/${COUNTER_KEY}`)
        .then(r => r.json())
        .then(data => {
          localStorage.setItem('visitor_counted', '1');
          setVisitorCount(data.value);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    history.replaceState({ screen: 'menu' }, '');

    const handlePopState = () => {
      setCurrentQuizType(null);
      setScreen('menu');
      setShowSettings(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const startQuiz = (quizType: QuizType, mode: QuizMode = 'normal') => {
    history.pushState({ screen: 'quiz' }, '');
    setCurrentQuizType(quizType);
    setCurrentQuizMode(mode);
    setScreen('quiz');
  };

  const exitQuiz = () => {
    history.back();
  };

  const onStatsUpdate = () => {
    setStatsVersion(v => v + 1);
  };

  return (
    <div class="app">
      <Header
        key={`header-${statsVersion}`}
        language={language}
        onLanguageChange={setLanguage}
        showBackButton={screen === 'quiz' || screen === 'changelog'}
        onBack={screen === 'changelog' ? () => setScreen('menu') : exitQuiz}
        onSettingsClick={() => setShowSettings(true)}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />

      <main class="main">
        {screen === 'menu' && (
          <MainMenu
            onStartQuiz={startQuiz}
            onOpenChangelog={() => {
              history.pushState({ screen: 'changelog' }, '');
              setScreen('changelog');
            }}
            language={language}
            hasNewChangelog={hasNewChangelog}
          />
        )}

        {screen === 'changelog' && (
          <ChangelogScreen />
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

      <StatsFooter
        key={`footer-${statsVersion}`}
        language={language}
        quizType={currentQuizType}
        needRefresh={needRefresh}
        onUpdate={() => updateServiceWorker(true)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onDataImported={onStatsUpdate}
        onPacksChanged={onStatsUpdate}
        theme={theme}
        onToggleTheme={toggleTheme}
        visitorCount={visitorCount}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
    </div>
  );
}
