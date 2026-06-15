import { useRef, useState, useEffect } from 'preact/hooks';
import { Trophy, User, Settings, Sun, Moon, Download, Upload, Users, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle, Crown, Star, Zap } from 'lucide-preact';
import { exportData, importData, getUsername, setUsername, getAvatarIndex, setAvatarIndex, resetData } from '../services/storage';
import { getRandomUsername } from '../data/username-words';
import type { User as AuthUser } from '../services/auth';
import { pushProfile, pullProfile, updateMyData, downloadData, fetchLeaderboard, UsernameConflictError } from '../services/sync';
import type { LeaderboardEntry } from '../services/sync';
import { Avatar, AvatarPicker } from './AvatarPicker';
import { APP_URL } from '../data/constants';
import { t } from '../data/translations';
import { useLanguage, useTheme } from '../hooks';
import './ProfileScreen.css';

interface ProfileScreenProps {
  visitorCount: number | null;
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDataImported?: () => void;
}

type Tab = 'leaderboard' | 'profile' | 'settings';

export function ProfileScreen({ visitorCount, user, onSignIn, onSignOut, onDataImported }: ProfileScreenProps) {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const tr = (key: string, replacements?: Record<string, string | number>) => t(key, language, replacements);
  const [activeTab, setActiveTab] = useState<Tab>(user ? 'leaderboard' : 'profile');
  const [username, setUsernameState] = useState(getUsername);
  const [avatarIndex, setAvatarIndexState] = useState(getAvatarIndex);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [syncCooldown, setSyncCooldown] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [leaderboardTab, setLeaderboardTab] = useState<'daily' | 'last7' | 'last30'>('daily');
  const leaderboardFetched = useRef(false);
  const leaderboardTabOpened = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFetched = useRef(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const SYNC_COOLDOWN_MS = 15 * 60 * 1000;
  const LAST_SYNC_KEY = 'woorden_last_sync';

  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return;
    const elapsed = Date.now() - Number(stored);
    if (elapsed < SYNC_COOLDOWN_MS) {
      startCooldown(Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000));
    }
  }, []);

  const startCooldown = (seconds: number) => {
    setSyncCooldown(seconds);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setSyncCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSyncAction = async (action: () => Promise<void>) => {
    if (!user || syncState === 'busy' || syncCooldown > 0) return;
    setSyncState('busy');
    try {
      await action();
      const now = Date.now().toString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(new Date().toISOString());
      setSyncState('done');
      startCooldown(SYNC_COOLDOWN_MS / 1000);
      setTimeout(() => setSyncState('idle'), 2000);
    } catch {
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 3000);
    }
  };

  const LEADERBOARD_CACHE_KEY = 'woorden_leaderboard_cache';
  const LEADERBOARD_CACHE_TS_KEY = 'woorden_leaderboard_ts';

  const loadLeaderboard = () => {
    if (leaderboardFetched.current) return;
    leaderboardFetched.current = true;

    // Saat başı + 5 dakika sonra güncellenir, o zamana kadar cache geçerli
    const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    const cachedTs = Number(localStorage.getItem(LEADERBOARD_CACHE_TS_KEY) ?? 0);
    const now = Date.now();
    const nextUpdate = (() => {
      const d = new Date();
      d.setMinutes(5, 0, 0);
      if (d.getTime() <= now) d.setHours(d.getHours() + 1);
      return d.getTime();
    })();

    if (cached && cachedTs > 0 && now < nextUpdate) {
      try { setLeaderboard(JSON.parse(cached)); return; } catch { /* fall through */ }
    }

    fetchLeaderboard().then((data) => {
      setLeaderboard(data);
      localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(LEADERBOARD_CACHE_TS_KEY, String(Date.now()));
    }).catch(() => setLeaderboard([]));
  };

  useEffect(() => {
    if (activeTab === 'leaderboard' && user && !leaderboardTabOpened.current) {
      leaderboardTabOpened.current = true;
      loadLeaderboard();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || profileFetched.current) return;
    profileFetched.current = true;
    pullProfile(user).then((remote) => {
      if (!remote) {
        const name = getRandomUsername();
        const avatar = Math.floor(Math.random() * 16);
        setUsernameState(name);
        setUsername(name);
        setAvatarIndexState(avatar);
        setAvatarIndex(avatar);
        pushProfile(user, name, avatar).catch(() => {});
        return;
      }
      if (remote.username) { setUsernameState(remote.username); setUsername(remote.username); }
      if (remote.avatarIndex) { setAvatarIndexState(remote.avatarIndex); setAvatarIndex(remote.avatarIndex); }
      setLastSync(remote.lastSync);
    }).catch(() => {});
  }, [user]);

  const handleUsernameBlur = () => {
    setUsername(username.trim());
    setUsernameState(username.trim());
  };

  const handleAvatarSelect = (index: number) => {
    setAvatarIndexState(index);
    setShowAvatarPicker(false);
  };

  const handleSave = async () => {
    const trimmed = username.trim();
    setUsername(trimmed);
    setAvatarIndex(avatarIndex);
    if (!user) return;

    setSaveState('saving');
    try {
      await pushProfile(user, trimmed, avatarIndex);
      setSaveState('saved');
      setLastSync(new Date().toISOString());
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      if (e instanceof UsernameConflictError) {
        setSaveState('conflict');
      } else {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `woorden_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      if (result.success) {
        alert(result.message);
        onDataImported?.();
      } else {
        alert(`Import failed: ${result.message}`);
      }
    };
    reader.readAsText(file);
    target.value = '';
  };

  const tabs: { id: Tab; icon: typeof Trophy; label: string }[] = [
    { id: 'leaderboard', icon: Trophy, label: tr('tab_leaderboard') },
    { id: 'profile', icon: User, label: tr('tab_profile') },
    { id: 'settings', icon: Settings, label: tr('tab_settings') },
  ];

  return (
    <div class="profile-screen">
      <div class="profile-tabs">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            class={`profile-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div class="profile-tab-content">
        {activeTab === 'leaderboard' && (() => {
          const scoreKey = leaderboardTab === 'daily' ? 'daily' : leaderboardTab === 'last7' ? 'last7' : 'last30';
          const correctKey = leaderboardTab === 'daily' ? 'dailyCorrect' : leaderboardTab === 'last7' ? 'last7Correct' : 'last30Correct';
          const myUsername = getUsername();
          const allSorted = leaderboard
            ? [...leaderboard].sort((a, b) => b[scoreKey] - a[scoreKey])
            : [];
          const myRank = allSorted.findIndex((e) => e.username === myUsername);
          // Top 20, but always include the current user at position 20 if they fall outside
          const top20 = allSorted.slice(0, 20);
          const meInTop20 = myRank === -1 || myRank < 20;
          const sorted = meInTop20
            ? top20
            : [...top20.slice(0, 19), allSorted[myRank]];

          const nextUpdateStr = (() => {
            const d = new Date();
            d.setMinutes(5, 0, 0);
            if (d.getTime() <= Date.now()) d.setHours(d.getHours() + 1);
            const localeMap: Record<string, string> = { tr: 'tr-TR', en: 'en-GB', ar: 'ar-SA', fr: 'fr-FR' };
            return d.toLocaleTimeString(localeMap[language] ?? 'en-GB', { hour: '2-digit', minute: '2-digit' });
          })();

          const RankIcon = ({ rank }: { rank: number }) => {
            if (rank === 0) return <Crown size={18} style="color:#f5a623" />;
            if (rank === 1) return <Star size={16} style="color:#9c27b0" />;
            if (rank === 2) return <Zap size={15} style="color:#2196f3" />;
            return <span class="leaderboard-rank-num">{rank + 1}</span>;
          };

          const listContent = (
            <div>
              <div class="leaderboard-tabs">
                {(['daily', 'last7', 'last30'] as const).map((t) => (
                  <button
                    key={t}
                    class={`leaderboard-tab${leaderboardTab === t ? ' active' : ''}`}
                    onClick={() => setLeaderboardTab(t)}
                  >
                    {t === 'daily' ? tr('lb_today') : t === 'last7' ? tr('lb_7days') : tr('lb_30days')}
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
        })()}

        {activeTab === 'profile' && (
          <div class="profile-section-list">
            {!user ? (
              <section class="profile-section">
                <h3>
                  <User size={16} />
                  {tr('profile_account')}
                </h3>
                <div class="profile-signin-prompt">
                  <ul class="profile-signin-reasons">
                    <li>{tr('profile_signin_reason1')}</li>
                    <li>{tr('profile_signin_reason2')}</li>
                  </ul>
                  <button class="profile-btn profile-btn--full" onClick={onSignIn}>
                    <LogIn size={16} />
                    {tr('lb_signin_google')}
                  </button>
                </div>
              </section>
            ) : (
              <>
                <section class="profile-section">
                  <div class="profile-avatar-row">
                    <div class="profile-avatar-display">
                      <Avatar index={avatarIndex} size={72} />
                    </div>
                    <div class="profile-avatar-meta">
                      <span class="profile-email">{user.email}</span>
                      <button
                        class="profile-btn profile-btn--sm"
                        onClick={() => setShowAvatarPicker(v => !v)}
                      >
                        {showAvatarPicker ? tr('profile_avatar_close') : tr('profile_avatar_change')}
                      </button>
                    </div>
                  </div>

                  {showAvatarPicker && (
                    <div class="profile-avatar-picker-wrap">
                      <AvatarPicker selectedIndex={avatarIndex} onSelect={handleAvatarSelect} />
                    </div>
                  )}
                </section>

                <section class="profile-section">
                  <h3>{tr('profile_username')}</h3>
                  <div class="profile-username-row">
                    <input
                      class={`profile-username-input${saveState === 'conflict' ? ' profile-username-input--error' : ''}`}
                      type="text"
                      placeholder={tr('profile_username_placeholder')}
                      value={username}
                      onInput={(e) => { setUsernameState((e.target as HTMLInputElement).value); setSaveState('idle'); }}
                      onBlur={handleUsernameBlur}
                      maxLength={24}
                    />
                    <button
                      class="profile-btn profile-btn--sm"
                      onClick={() => { const name = getRandomUsername(); setUsernameState(name); setUsername(name); setSaveState('idle'); }}
                      title="Rastgele kullanıcı adı üret"
                    >
                      <Shuffle size={14} />
                    </button>
                  </div>
                  {saveState === 'conflict' && (
                    <p class="profile-input-error">{tr('profile_username_taken')}</p>
                  )}
                </section>

                <section class="profile-section">
                  <button
                    class={`profile-btn profile-btn--full profile-btn--primary${saveState === 'error' || saveState === 'conflict' ? ' profile-btn--danger' : ''}`}
                    onClick={handleSave}
                    disabled={saveState === 'saving' || !username.trim()}
                  >
                    <Save size={16} />
                    {saveState === 'saving' ? tr('profile_saving') : saveState === 'saved' ? tr('profile_saved') : saveState === 'error' ? tr('profile_error') : tr('profile_save')}
                  </button>
                </section>

                {lastSync && (
                  <p class="profile-last-sync">
                    {tr('profile_last_sync', { date: new Date(lastSync).toLocaleString() })}
                  </p>
                )}

                {syncCooldown > 0 && (
                  <p class="profile-sync-cooldown">
                    {tr('profile_next_action', { time: `${Math.floor(syncCooldown / 60)}:${String(syncCooldown % 60).padStart(2, '0')}` })}
                  </p>
                )}

                <section class="profile-section">
                  <h3>
                    <RefreshCw size={16} />
                    {tr('profile_sync_data')}
                  </h3>
                  <p class="profile-action-desc">{tr('profile_sync_desc')}</p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => updateMyData(user!, 'merge'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <RefreshCw size={16} />
                    {syncState === 'busy' ? tr('profile_processing') : syncState === 'done' ? tr('profile_done') : syncState === 'error' ? tr('profile_action_error') : tr('profile_sync_data')}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <CloudDownload size={16} />
                    {tr('profile_get_data')}
                  </h3>
                  <p class="profile-action-desc">{tr('profile_get_desc')}</p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => downloadData(user!, 'override'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <CloudDownload size={16} />
                    {syncState === 'busy' ? tr('profile_processing') : syncState === 'done' ? tr('profile_done') : syncState === 'error' ? tr('profile_action_error') : tr('profile_get_data')}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <CloudUpload size={16} />
                    {tr('profile_upload_data')}
                  </h3>
                  <p class="profile-action-desc">{tr('profile_upload_desc')}</p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => updateMyData(user!, 'override'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <CloudUpload size={16} />
                    {syncState === 'busy' ? tr('profile_processing') : syncState === 'done' ? tr('profile_done') : syncState === 'error' ? tr('profile_action_error') : tr('profile_upload_data')}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <Trash2 size={16} />
                    {tr('profile_delete_all')}
                  </h3>
                  <p class="profile-action-desc">{tr('profile_delete_desc')}</p>
                  <button
                    class="profile-btn profile-btn--full profile-btn--danger"
                    onClick={() => {
                      if (confirm(tr('profile_delete_confirm'))) {
                        resetData();
                        onDataImported?.();
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    {tr('profile_delete_all')}
                  </button>
                </section>

                <section class="profile-section">
                  <button class="profile-btn profile-btn--full profile-btn--danger" onClick={onSignOut}>
                    <LogOut size={16} />
                    {tr('profile_signout')}
                  </button>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div class="profile-section-list">
            <section class="profile-section">
              <h3>
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {tr('settings_theme')}
              </h3>
              <div class="profile-theme-toggle">
                <button
                  class={`profile-theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => theme === 'dark' && toggleTheme()}
                >
                  <Sun size={16} />
                  {tr('settings_light')}
                </button>
                <button
                  class={`profile-theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => theme === 'light' && toggleTheme()}
                >
                  <Moon size={16} />
                  {tr('settings_dark')}
                </button>
              </div>
            </section>

            <section class="profile-section">
              <h3>
                <Download size={16} />
                {tr('settings_data')}
              </h3>
              <div class="profile-data-actions">
                <button class="profile-btn" onClick={handleExport}>
                  <Download size={16} />
                  {tr('settings_export')}
                </button>
                <button class="profile-btn" onClick={handleImportClick}>
                  <Upload size={16} />
                  {tr('settings_import')}
                </button>
              </div>
            </section>

            <div class="profile-visitor-footer">
              <Users size={13} />
              {visitorCount !== null
                ? <span>{visitorCount.toLocaleString()} {visitorCount === 1 ? tr('settings_visitor') : tr('settings_visitors')}</span>
                : <span class="visitor-loading">···</span>
              }
            </div>

            <div class="profile-legal-links">
              <a href="/privacy" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Privacy Policy</a>
              <span class="profile-legal-sep">·</span>
              <a href="/terms" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/terms'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Terms of Service</a>
              <span class="profile-legal-sep">·</span>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer">myniqx.dev</a>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
