import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, Flame, Zap, Star, Crown, User } from 'lucide-preact';
import { getDailyStats, getDailyLevel } from '../services/storage';
import type { User as AuthUser } from '../services/auth';
import { useLanguage } from '../hooks';
import { Button } from './commons';
import './Header.css';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onProfileClick?: () => void;
  user: AuthUser | null;
}

const languages = [
  { code: 'tr' as const, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];

export function Header({ showBackButton = false, onBack, onProfileClick, user }: HeaderProps) {
  const { language, setLanguage } = useLanguage();
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
          <Button variant="ghost" icon={ChevronLeft} size="icon" onClick={onBack} aria-label="Go back" class="back-btn" />
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
                onClick={() => setLanguage(lang.code)}
              >
                <span class="lang-flag">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onProfileClick}
          aria-label="Profile"
          class={user ? 'profile-btn--logged-in' : ''}
        >
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} class="profile-btn-avatar" alt="avatar" />
            : <User size={20} />
          }
        </Button>
      </div>
    </header>
  );
}
