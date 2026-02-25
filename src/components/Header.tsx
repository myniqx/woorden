import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, Settings, Flame, Zap, Star, Crown } from 'lucide-preact';
import type { Language } from '../types';
import { getDailyStats, getDailyLevel } from '../services/storage';
import './Header.css';

interface HeaderProps {
  language: Language;
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
  language,
  onLanguageChange,
  showBackButton = false,
  onBack,
  onSettingsClick,
}: HeaderProps) {
  const currentLang = languages.find(l => l.code === language);
  const dailyStats = getDailyStats();
  const { level, goal } = getDailyLevel();
  const progressPercent = Math.min((dailyStats.practiced / goal) * 100, 100);

  const SIZE = 28;
  const STROKE = 3;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - progressPercent / 100);

  const LevelIcon = level === 1 ? Flame : level === 2 ? Zap : level === 3 ? Star : Crown;

  const SESSION_KEY = 'woorden_last_level';
  const prevLevel = Number(sessionStorage.getItem(SESSION_KEY) || level);
  const isLevelUp = prevLevel < level;
  sessionStorage.setItem(SESSION_KEY, String(level));

  const [levelUpAnim, setLevelUpAnim] = useState(isLevelUp);

  useEffect(() => {
    if (isLevelUp) {
      setLevelUpAnim(true);
      const t = setTimeout(() => setLevelUpAnim(false), 500);
      return () => clearTimeout(t);
    }
  }, [isLevelUp]);

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
        <div
          class={`daily-badge level-${level}${levelUpAnim ? ' level-up' : ''}`}
          title={`${dailyStats.practiced} / ${goal}`}
        >
          <div class="daily-badge-circle">
            <svg width={SIZE} height={SIZE}>
              <circle
                class="circular-track"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke-width={STROKE}
              />
              <circle
                class="circular-fill"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                stroke-width={STROKE}
                stroke-dasharray={CIRCUMFERENCE}
                stroke-dashoffset={dashOffset}
                stroke-linecap="round"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            </svg>
            <div class="circular-icon">
              <LevelIcon size={13} />
            </div>
          </div>
          <span class="daily-badge-text">{dailyStats.practiced}/{goal}</span>
        </div>
      </div>

      <div class="header-right">
        <div class="language-selector">
          <button class="header-btn language-btn" aria-label="Select language">
            <span class="lang-flag">{currentLang?.flag}</span>
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
      </div>
    </header>
  );
}
