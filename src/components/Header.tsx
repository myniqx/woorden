import { Sun, Moon, ChevronLeft, Globe, Flame, Settings } from 'lucide-preact';
import type { Language } from '../types';
import { getStreak, getDailyStats, getDailyGoal } from '../services/storage';
import './Header.css';

interface HeaderProps {
  theme: 'light' | 'dark';
  language: Language;
  onToggleTheme: () => void;
  onLanguageChange: (lang: Language) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  onSettingsClick?: () => void;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function Header({
  theme,
  language,
  onToggleTheme,
  onLanguageChange,
  showBackButton = false,
  onBack,
  onSettingsClick,
}: HeaderProps) {
  const currentLang = languages.find(l => l.code === language);
  const streak = getStreak();
  const dailyStats = getDailyStats();
  const dailyGoal = getDailyGoal();
  const progressPercent = Math.min((dailyStats.practiced / dailyGoal) * 100, 100);

  return (
    <header class="header">
      <div class="header-left">
        {showBackButton ? (
          <button class="header-btn back-btn" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div class="logo">
            <span class="logo-icon">W</span>
            <span class="logo-text">oorden</span>
          </div>
        )}
      </div>

      <div class="header-center">
        <div class="streak-badge" title="Daily streak">
          <Flame size={16} />
          <span>{streak}</span>
        </div>

        <div class="daily-progress" title={`${dailyStats.practiced} / ${dailyGoal}`}>
          <div class="daily-progress-bar">
            <div
              class="daily-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span class="daily-progress-text">
            {dailyStats.practiced}/{dailyGoal}
          </span>
        </div>
      </div>

      <div class="header-right">
        <div class="language-selector">
          <button class="header-btn language-btn" aria-label="Select language">
            <span class="lang-flag">{currentLang?.flag}</span>
            <Globe size={16} />
          </button>
          <div class="language-dropdown">
            {languages.map(lang => (
              <button
                key={lang.code}
                class={`language-option ${lang.code === language ? 'active' : ''}`}
                onClick={() => onLanguageChange(lang.code)}
              >
                <span class="lang-flag">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button class="header-btn settings-btn" onClick={onSettingsClick} aria-label="Settings">
          <Settings size={20} />
        </button>

        <button class="header-btn theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
