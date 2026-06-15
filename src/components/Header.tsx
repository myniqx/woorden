import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, Flame, Zap, Star, Crown, User } from 'lucide-preact';
import { getDailyStats, getDailyLevel } from '../services/storage';
import type { User as AuthUser } from '../services/auth';
import { useLanguage } from '../hooks';
import { Button } from './commons';

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

const levelColor: Record<number, string> = {
  1: 'bg-[rgba(255,107,53,0.12)] text-[#ff6b35]',
  2: 'bg-[rgba(33,150,243,0.12)] text-[#2196f3]',
  3: 'bg-[rgba(156,39,176,0.12)] text-[#9c27b0]',
  4: 'bg-[rgba(245,166,35,0.12)] text-[#f5a623]',
};

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

  const headerBtnClass = 'flex items-center justify-center p-[var(--spacing-sm)] bg-transparent border-none rounded-[var(--radius-md)] text-[var(--color-text-secondary)] cursor-pointer transition-all duration-[var(--transition-fast)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]';

  return (
    <header class="flex justify-between items-center px-[var(--spacing-lg)] py-[var(--spacing-md)] bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-[100]">
      <div class="flex items-center gap-[var(--spacing-sm)]">
        {showBackButton ? (
          <Button variant="ghost" icon={ChevronLeft} size="icon" onClick={onBack} aria-label="Go back" class="-ml-[var(--spacing-sm)]" />
        ) : (
          <div class="flex items-center gap-[var(--spacing-xs)] font-semibold text-[length:var(--text-xl)]">
            <span class="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white rounded-[var(--radius-md)] font-bold">W</span>
            <span class="text-[var(--color-text-primary)] hidden sm:inline">oorden</span>
          </div>
        )}
      </div>

      <div class="flex items-center gap-[var(--spacing-md)]">
        <div
          class={`flex items-center gap-1.5 py-1 pr-2.5 pl-1 rounded-full font-semibold text-[length:var(--text-sm)] transition-[background-color,color] duration-400 ${levelColor[level] ?? levelColor[1]} ${levelUpAnim ? 'level-up' : ''}`}
          title={`${dailyStats.practiced} / ${goal}`}
        >
          <div class="relative flex items-center justify-center w-7 h-7 shrink-0">
            <svg width={SIZE} height={SIZE} class="absolute">
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                fill="none" stroke-width={STROKE}
                stroke="currentColor" opacity={0.2}
              />
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                fill="none" stroke="currentColor" stroke-width={STROKE}
                stroke-dasharray={CIRCUMFERENCE} stroke-dashoffset={dashOffset}
                stroke-linecap="round"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                class="transition-[stroke-dashoffset] duration-[var(--transition-normal)]"
              />
            </svg>
            <div class="relative flex items-center justify-center">
              <LevelIcon size={13} />
            </div>
          </div>
          <span class="leading-none">{dailyStats.practiced}/{goal}</span>
        </div>
      </div>

      <div class="flex items-center gap-[var(--spacing-sm)]">
        {/* CSS-only dropdown: group hover + focus-within gösterir */}
        <div class="relative group">
          <button class={`${headerBtnClass} gap-[var(--spacing-xs)]`} aria-label="Select language">
            <span class="text-[length:var(--text-lg)]">{currentLang?.flag}</span>
          </button>
          <div class="absolute top-full right-0 mt-[var(--spacing-xs)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] min-w-[150px] overflow-hidden z-[200] opacity-0 invisible -translate-y-2.5 transition-all duration-[var(--transition-fast)] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
            {languages.map(lang => (
              <button
                key={lang.code}
                class={`flex items-center gap-[var(--spacing-sm)] w-full px-[var(--spacing-md)] py-[var(--spacing-sm)] bg-transparent border-none text-[var(--color-text-primary)] cursor-pointer text-left transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-primary-light)] ${lang.code === language ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : ''}`}
                onClick={() => setLanguage(lang.code)}
              >
                <span class="text-[length:var(--text-lg)]">{lang.flag}</span>
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
          class={user ? 'rounded-full border-2 border-[var(--color-primary)] p-1 w-8 h-8' : 'rounded-full border-2 border-transparent p-1 w-8 h-8'}
        >
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} class="w-[22px] h-[22px] rounded-full block" alt="avatar" />
            : <User size={20} />
          }
        </Button>
      </div>
    </header>
  );
}
