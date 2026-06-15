import { useState } from 'preact/hooks';
import { Crown, Star, Zap, LogIn } from 'lucide-preact';
import { Avatar } from '../AvatarPicker';
import { getUsername } from '../../services/storage';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
import type { LeaderboardEntry } from '../../services/sync';
import type { ProfileSharedProps } from './types';

type ScoreTab = 'daily' | 'last7' | 'last30';

interface LeaderboardTabProps extends Pick<ProfileSharedProps, 'user' | 'onSignIn'> {
  leaderboard: LeaderboardEntry[] | null;
}

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Crown size={18} style="color:#f5a623" />;
  if (rank === 1) return <Star size={16} style="color:#9c27b0" />;
  if (rank === 2) return <Zap size={15} style="color:#2196f3" />;
  return <span class="leaderboard-rank-num">{rank + 1}</span>;
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

  const listContent = (
    <div>
      <div class="leaderboard-tabs">
        {(['daily', 'last7', 'last30'] as const).map((tab) => (
          <button
            key={tab}
            class={`leaderboard-tab${scoreTab === tab ? ' active' : ''}`}
            onClick={() => setScoreTab(tab)}
          >
            {tab === 'daily' ? tr('lb_today') : tab === 'last7' ? tr('lb_7days') : tr('lb_30days')}
          </button>
        ))}
      </div>

      {leaderboard === null ? (
        <p class="leaderboard-loading">{tr('lb_loading')}</p>
      ) : sorted.length === 0 ? (
        <p class="leaderboard-empty">{tr('lb_empty')}</p>
      ) : (
        <div class="leaderboard-list">
          {sorted.map((entry, i) => {
            const realRank = allSorted.findIndex((e) => e.username === entry.username);
            const score = entry[scoreKey];
            const correct = entry[correctKey];
            const pct = score > 0 ? Math.round((correct / score) * 100) : 0;
            const isMe = entry.username === myUsername;
            const rowClass = realRank === 0 ? 'leaderboard-row--gold' : realRank === 1 ? 'leaderboard-row--silver' : realRank === 2 ? 'leaderboard-row--bronze' : '';
            return (
              <div key={entry.username} class={`leaderboard-row ${rowClass}`}>
                <span class="leaderboard-rank"><RankIcon rank={realRank} /></span>
                <span class="leaderboard-avatar"><Avatar index={entry.avatarIndex} size={i < 3 ? 36 : 30} /></span>
                <span class={`leaderboard-username${isMe ? ' leaderboard-username--me' : ''}`}>{entry.username}</span>
                <span class="leaderboard-score-wrap">
                  <span class="leaderboard-score">{score}</span>
                  <span class="leaderboard-correct">{correct} <span class="leaderboard-pct">%{pct}</span></span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p class="leaderboard-update-note">{tr('lb_update_note', { time: nextUpdateStr })}</p>
    </div>
  );

  if (!user) {
    return (
      <div class="leaderboard-wrap">
        <div class="leaderboard-blur">{listContent}</div>
        <div class="leaderboard-gate">
          <p>{tr('lb_gate_text')}</p>
          <button class="profile-btn profile-btn--primary" onClick={onSignIn}>
            <LogIn size={16} />
            {tr('lb_signin_google')}
          </button>
        </div>
      </div>
    );
  }

  return listContent;
}
