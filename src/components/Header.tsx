import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, Flame, Zap, Star, Crown, User } from 'lucide-preact';
import { getDailyStats, getDailyLevel } from '../services/storage';
import type { User as AuthUser } from '../services/auth';
import { useLanguage, useAppLayout } from '../hooks';
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
  const { headerCenter } = useAppLayout();
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

  const headerBtnClass = 'flex items-center justify-center p-2 bg-transparent border-none rounded-md text-text-secondary cursor-pointer transition-all duration-(--transition-fast) hover:bg-primary-light hover:text-primary';

  return (
    <header class="flex items-center px-6 py-4 bg-surface border-b border-border sticky top-0 z-[100] gap-2 h-14">
      <div class="flex items-center gap-2 shrink-0">
        {showBackButton ? (
          <Button variant="ghost" icon={ChevronLeft} size="icon" onClick={onBack} aria-label="Go back" class="-ml-2" />
        ) : (
          <div class="flex items-center gap-1 font-semibold text-xl">
            <span class="flex items-center justify-center w-8 h-8 bg-linear-to-br from-primary to-primary-hover text-white rounded-md font-bold">W</span>
            <span class="text-text-primary hidden sm:inline">oorden</span>
          </div>
        )}
      </div>

      <div class="flex items-center gap-4 flex-1 justify-center">
        {headerCenter ? <div class="flex-1 flex items-center">{headerCenter}</div> : <div
          class={`flex items-center gap-1.5 py-1 pr-2.5 pl-1 rounded-full font-semibold text-sm transition-[background-color,color] duration-400 ${levelColor[level] ?? levelColor[1]} ${levelUpAnim ? 'level-up' : ''}`}
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
                class="transition-[stroke-dashoffset] duration-(--transition-normal)"
              />
            </svg>
            <div class="relative flex items-center justify-center">
              <LevelIcon size={13} />
            </div>
          </div>
          <span class="leading-none">{dailyStats.practiced}/{goal}</span>
        </div>}
      </div>

      <div class="flex items-center gap-2 shrink-0 ml-auto">
        {/* CSS-only dropdown: group hover + focus-within gösterir */}
        <div class="relative group">
          <button class={`${headerBtnClass} gap-1`} aria-label="Select language">
            <span class="text-lg">{currentLang?.flag}</span>
          </button>
          <div class="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg min-w-[150px] overflow-hidden z-[200] opacity-0 invisible -translate-y-2.5 transition-all duration-(--transition-fast) group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
            {languages.map(lang => (
              <button
                key={lang.code}
                class={`flex items-center gap-2 w-full px-4 py-2 bg-transparent border-none text-text-primary cursor-pointer text-left transition-colors duration-(--transition-fast) hover:bg-primary-light ${lang.code === language ? 'bg-primary-light text-primary' : ''}`}
                onClick={() => setLanguage(lang.code)}
              >
                <span class="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="avatar"
          onClick={onProfileClick}
          aria-label="Profile"
          class={`w-8 h-8 border-2 ${user ? 'border-primary' : 'border-transparent'}`}
        >
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} class="w-full h-full object-cover" alt="avatar" />
            : <User size={20} />
          }
        </Button>
      </div>
    </header>
  );
}
