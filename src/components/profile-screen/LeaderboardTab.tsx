import { useState } from 'preact/hooks';
import { Crown, Star, Zap, LogIn } from 'lucide-preact';
import { Avatar } from './AvatarPicker';
import { getUsername } from '../../services/storage';
import { useLanguage } from '../../hooks';
import type { LeaderboardEntry } from '../../services/sync';
import type { ProfileSharedProps } from './types';
import { Badge, Button } from '../commons';

type ScoreTab = 'daily' | 'last7' | 'last30';

interface LeaderboardTabProps extends Pick<ProfileSharedProps, 'user' | 'onSignIn'> {
  leaderboard: LeaderboardEntry[] | null;
  fetchedAt: Date | null;
}

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Crown size={18} style="color:#f5a623" />;
  if (rank === 1) return <Star size={16} style="color:#9c27b0" />;
  if (rank === 2) return <Zap size={15} style="color:#2196f3" />;
  return <Badge variant="outline" color="muted" size="sm">{rank + 1}</Badge>;
};

export function LeaderboardTab({ user, onSignIn, leaderboard, fetchedAt }: LeaderboardTabProps) {
  const { t, merge } = useLanguage();
  const { language } = useLanguage();
  const [scoreTab, setScoreTab] = useState<ScoreTab>('daily');

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

  const localeMap: Record<string, string> = { tr: 'tr-TR', en: 'en-GB', ar: 'ar-SA', fr: 'fr-FR' };
  const fetchedAtStr = fetchedAt
    ? fetchedAt.toLocaleTimeString(localeMap[language] ?? 'en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  const tabLabel = (tab: ScoreTab) => ({
    daily: t.leaderboard.today,
    last7: t.leaderboard.last7,
    last30: t.leaderboard.last30,
  }[tab]);

  const rowAccent: Record<number, string> = {
    0: 'border-l-[3px] border-l-[#f5a623] bg-[color-mix(in_srgb,#f5a623_8%,var(--color-surface-elevated))]',
    1: 'border-l-[3px] border-l-[#9c27b0] bg-[color-mix(in_srgb,#9c27b0_8%,var(--color-surface-elevated))]',
    2: 'border-l-[3px] border-l-[#2196f3] bg-[color-mix(in_srgb,#2196f3_8%,var(--color-surface-elevated))]',
  };

  const listContent = (
    <div>
      <div class="flex gap-1 mb-4">
        {(['daily', 'last7', 'last30'] as const).map((tab) => (
          <button
            key={tab}
            class={`flex-1 px-2 py-1 border rounded-md text-xs font-medium cursor-pointer transition-[border-color,background,color] duration-(--transition-fast) ${scoreTab === tab ? 'bg-primary-light border-primary text-primary' : 'bg-bg border-border text-text-secondary'}`}
            onClick={() => setScoreTab(tab)}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {leaderboard === null ? (
        <p class="text-center py-8 text-text-muted text-sm">{t.leaderboard.loading}</p>
      ) : sorted.length === 0 ? (
        <p class="text-center py-8 text-text-muted text-sm">{t.leaderboard.empty}</p>
      ) : (
        <div class="flex flex-col gap-1">
          {sorted.map((entry, i) => {
            const realRank = allSorted.findIndex((e) => e.username === entry.username);
            const score = entry[scoreKey];
            const correct = entry[correctKey];
            const pct = score > 0 ? Math.round((correct / score) * 100) : 0;
            const isMe = entry.username === myUsername;
            return (
              <div key={entry.username} class={`flex items-center gap-2 px-4 py-2 bg-(--color-surface-elevated) rounded-md ${rowAccent[realRank] ?? ''}`}>
                <span class="w-6 flex items-center justify-center shrink-0"><RankIcon rank={realRank} /></span>
                <span class="shrink-0"><Avatar index={entry.avatarIndex} size={i < 3 ? 36 : 30} /></span>
                <span class={`flex-1 text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-text-primary'}`}>{entry.username}</span>
                <span class="flex flex-col items-end shrink-0 gap-px">
                  <span class="text-sm font-bold text-text-primary">{score}</span>
                  <span class="text-xs text-success">{correct} <span class="text-text-muted">%{pct}</span></span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div class="mt-4 flex flex-col items-center gap-1">
        <p class="m-0 text-xs text-text-muted text-center">{t.leaderboard.updateNote}</p>
        {fetchedAtStr && (
          <p class="m-0 text-xs text-text-muted text-center">
            {merge(t.leaderboard.lastFetched, { time: fetchedAtStr })}
          </p>
        )}
      </div>
    </div>
  );

  if (!user) {
    return (
      <div class="relative min-h-80">
        <div class="blur-xs pointer-events-none select-none">{listContent}</div>
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
          <p class="m-0 text-sm text-text-secondary text-center">{t.leaderboard.gateText}</p>
          <Button variant="soft" color="primary" icon={LogIn} onClick={onSignIn}>
            {t.leaderboard.signInGoogle}
          </Button>
        </div>
      </div>
    );
  }

  return listContent;
}
