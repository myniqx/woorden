import { useState } from 'preact/hooks';
import { Crown, Star, Zap, LogIn } from 'lucide-preact';
import { Avatar } from '../AvatarPicker';
import { getUsername } from '../../services/storage';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
import type { LeaderboardEntry } from '../../services/sync';
import type { ProfileSharedProps } from './types';
import { Badge, Button } from '../commons';

type ScoreTab = 'daily' | 'last7' | 'last30';

interface LeaderboardTabProps extends Pick<ProfileSharedProps, 'user' | 'onSignIn'> {
  leaderboard: LeaderboardEntry[] | null;
}

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Crown size={18} style="color:#f5a623" />;
  if (rank === 1) return <Star size={16} style="color:#9c27b0" />;
  if (rank === 2) return <Zap size={15} style="color:#2196f3" />;
  return <Badge variant="outline" color="muted" size="sm">{rank + 1}</Badge>;
};

export function LeaderboardTab({ user, onSignIn, leaderboard }: LeaderboardTabProps) {
  const { language } = useLanguage();
  const [scoreTab, setScoreTab] = useState<ScoreTab>('daily');

  const tr = (key: string, replacements?: Record<string, string | number>) => t(key, language, replacements);

  const scoreKey = scoreTab === 'daily' ? 'daily' : scoreTab === 'last7' ? 'last7' : 'last30';
  const correctKey = scoreTab === 'daily' ? 'dailyCorrect' : scoreTab === 'last7' ? 'last7Correct' : 'last30Correct';
  const myUsername = getUsername();

  const allSorted = leaderboard
    ? [...leaderboard].sort((a, b) => b[scoreKey] - a[scoreKey])
    : [];
  const myRank = allSorted.findIndex((e) => e.username === myUsername);
  const top20 = allSorted.slice(0, 20);
  const meInTop20 = myRank === -1 || myRank < 20;
  const sorted = meInTop20 ? top20 : [...top20.slice(0, 19), allSorted[myRank]];

  const nextUpdateStr = (() => {
    const d = new Date();
    d.setMinutes(5, 0, 0);
    if (d.getTime() <= Date.now()) d.setHours(d.getHours() + 1);
    const localeMap: Record<string, string> = { tr: 'tr-TR', en: 'en-GB', ar: 'ar-SA', fr: 'fr-FR' };
    return d.toLocaleTimeString(localeMap[language] ?? 'en-GB', { hour: '2-digit', minute: '2-digit' });
  })();

  const rowAccent: Record<number, string> = {
    0: 'border-l-[3px] border-l-[#f5a623] bg-[color-mix(in_srgb,#f5a623_8%,var(--color-surface-elevated))]',
    1: 'border-l-[3px] border-l-[#9c27b0] bg-[color-mix(in_srgb,#9c27b0_8%,var(--color-surface-elevated))]',
    2: 'border-l-[3px] border-l-[#2196f3] bg-[color-mix(in_srgb,#2196f3_8%,var(--color-surface-elevated))]',
  };

  const listContent = (
    <div>
      <div class="flex gap-[var(--spacing-xs)] mb-[var(--spacing-md)]">
        {(['daily', 'last7', 'last30'] as const).map((tab) => (
          <button
            key={tab}
            class={`flex-1 px-[var(--spacing-sm)] py-[var(--spacing-xs)] border rounded-[var(--radius-md)] text-[length:var(--text-xs)] font-medium cursor-pointer transition-[border-color,background,color] duration-[var(--transition-fast)] ${scoreTab === tab ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            onClick={() => setScoreTab(tab)}
          >
            {tab === 'daily' ? tr('lb_today') : tab === 'last7' ? tr('lb_7days') : tr('lb_30days')}
          </button>
        ))}
      </div>

      {leaderboard === null ? (
        <p class="text-center py-[var(--spacing-xl)] text-[var(--color-text-muted)] text-[length:var(--text-sm)]">{tr('lb_loading')}</p>
      ) : sorted.length === 0 ? (
        <p class="text-center py-[var(--spacing-xl)] text-[var(--color-text-muted)] text-[length:var(--text-sm)]">{tr('lb_empty')}</p>
      ) : (
        <div class="flex flex-col gap-[var(--spacing-xs)]">
          {sorted.map((entry, i) => {
            const realRank = allSorted.findIndex((e) => e.username === entry.username);
            const score = entry[scoreKey];
            const correct = entry[correctKey];
            const pct = score > 0 ? Math.round((correct / score) * 100) : 0;
            const isMe = entry.username === myUsername;
            return (
              <div key={entry.username} class={`flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] ${rowAccent[realRank] ?? ''}`}>
                <span class="w-6 flex items-center justify-center shrink-0"><RankIcon rank={realRank} /></span>
                <span class="shrink-0"><Avatar index={entry.avatarIndex} size={i < 3 ? 36 : 30} /></span>
                <span class={`flex-1 text-[length:var(--text-sm)] font-medium truncate ${isMe ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>{entry.username}</span>
                <span class="flex flex-col items-end shrink-0 gap-px">
                  <span class="text-[length:var(--text-sm)] font-bold text-[var(--color-text-primary)]">{score}</span>
                  <span class="text-[length:var(--text-xs)] text-[var(--color-success)]">{correct} <span class="text-[var(--color-text-muted)]">%{pct}</span></span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p class="mt-[var(--spacing-md)] m-0 text-[length:var(--text-xs)] text-[var(--color-text-muted)] text-center">{tr('lb_update_note', { time: nextUpdateStr })}</p>
    </div>
  );

  if (!user) {
    return (
      <div class="relative min-h-[320px]">
        <div class="blur-[4px] pointer-events-none select-none">{listContent}</div>
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-[var(--spacing-lg)] px-[var(--spacing-xl)]">
          <p class="m-0 text-[length:var(--text-sm)] text-[var(--color-text-secondary)] text-center">{tr('lb_gate_text')}</p>
          <Button variant="soft" color="primary" icon={LogIn} onClick={onSignIn}>
            {tr('lb_signin_google')}
          </Button>
        </div>
      </div>
    );
  }

  return listContent;
}
