import { useRef, useState, useEffect } from 'preact/hooks';
import { Trophy, User, Settings, Sun, Moon, Download, Upload, Users, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle, Crown, Star, Zap } from 'lucide-preact';
import { exportData, importData, getUsername, setUsername, getAvatarIndex, setAvatarIndex, resetData } from '../services/storage';
import { getRandomUsername } from '../data/username-words';
import type { User as AuthUser } from '../services/auth';
import { pushProfile, pullProfile, updateMyData, downloadData, fetchLeaderboard, UsernameConflictError } from '../services/sync';
import type { LeaderboardEntry } from '../services/sync';
import { Avatar, AvatarPicker } from './AvatarPicker';
import './ProfileScreen.css';

interface ProfileScreenProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  visitorCount: number | null;
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDataImported?: () => void;
  onPacksChanged?: () => void;
}

type Tab = 'leaderboard' | 'profile' | 'settings';

export function ProfileScreen({
  theme,
  onToggleTheme,
  visitorCount,
  user,
  onSignIn,
  onSignOut,
  onDataImported,
}: ProfileScreenProps) {
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
      if (!remote) return;
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
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
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
            return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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
                    {t === 'daily' ? 'Bugün' : t === 'last7' ? '7 Gün' : '30 Gün'}
                  </button>
                ))}
              </div>
              {leaderboard === null ? (
                <p class="leaderboard-loading">Yükleniyor...</p>
              ) : sorted.length === 0 ? (
                <p class="leaderboard-empty">Henüz veri yok.</p>
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
              <p class="leaderboard-update-note">Saat başı +5 dk. güncellenir · Sonraki: {nextUpdateStr}</p>
            </div>
          );

          if (!user) {
            return (
              <div class="leaderboard-wrap">
                <div class="leaderboard-blur">{listContent}</div>
                <div class="leaderboard-gate">
                  <p>Sıralamayı görmek için giriş yapın</p>
                  <button class="profile-btn profile-btn--primary" onClick={onSignIn}>
                    <LogIn size={16} />
                    Sign in with Google
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
                  Account
                </h3>
                <div class="profile-signin-prompt">
                  <ul class="profile-signin-reasons">
                    <li>Verilerinizi online yedeklemek için</li>
                    <li>Leaderboard'da yerinizi görmek için</li>
                  </ul>
                  <button class="profile-btn profile-btn--full" onClick={onSignIn}>
                    <LogIn size={16} />
                    Sign in with Google
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
                        {showAvatarPicker ? 'Kapat' : 'Değiştir'}
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
                  <h3>Kullanıcı Adı</h3>
                  <div class="profile-username-row">
                    <input
                      class={`profile-username-input${saveState === 'conflict' ? ' profile-username-input--error' : ''}`}
                      type="text"
                      placeholder="Kullanıcı adınız"
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
                    <p class="profile-input-error">Bu kullanıcı adı zaten alınmış.</p>
                  )}
                </section>

                <section class="profile-section">
                  <button
                    class={`profile-btn profile-btn--full profile-btn--primary${saveState === 'error' || saveState === 'conflict' ? ' profile-btn--danger' : ''}`}
                    onClick={handleSave}
                    disabled={saveState === 'saving' || !username.trim()}
                  >
                    <Save size={16} />
                    {saveState === 'saving' ? 'Kaydediliyor...' : saveState === 'saved' ? 'Kaydedildi' : saveState === 'error' ? 'Bir hata oluştu' : 'Kaydet'}
                  </button>
                </section>

                {lastSync && (
                  <p class="profile-last-sync">
                    Son yedek: {new Date(lastSync).toLocaleString('tr-TR')}
                  </p>
                )}

                {syncCooldown > 0 && (
                  <p class="profile-sync-cooldown">
                    Sonraki işlem için: {Math.floor(syncCooldown / 60)}:{String(syncCooldown % 60).padStart(2, '0')}
                  </p>
                )}

                <section class="profile-section">
                  <h3>
                    <RefreshCw size={16} />
                    Sync Data
                  </h3>
                  <p class="profile-action-desc">
                    Sunucudaki veriyi çeker, yerel veriyle birleştirir ve tekrar yükler. Her iki taraf da aynı veriye sahip olur.
                  </p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => updateMyData(user!, 'merge'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <RefreshCw size={16} />
                    {syncState === 'busy' ? 'İşleniyor...' : syncState === 'done' ? 'Tamamlandı' : syncState === 'error' ? 'Hata oluştu' : 'Sync Data'}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <CloudDownload size={16} />
                    Get Data
                  </h3>
                  <p class="profile-action-desc">
                    Sunucudaki veriyi çeker ve yerel verinin üzerine yazar. Yerel değişiklikler kaybolur.
                  </p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => downloadData(user!, 'override'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <CloudDownload size={16} />
                    {syncState === 'busy' ? 'İşleniyor...' : syncState === 'done' ? 'Tamamlandı' : syncState === 'error' ? 'Hata oluştu' : 'Get Data'}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <CloudUpload size={16} />
                    Upload Data
                  </h3>
                  <p class="profile-action-desc">
                    Yerel veriyi sunucuya yükler ve sunucudaki verinin üzerine yazar.
                  </p>
                  <button
                    class={`profile-btn profile-btn--full${syncState === 'error' ? ' profile-btn--danger' : ''}`}
                    onClick={() => handleSyncAction(() => updateMyData(user!, 'override'))}
                    disabled={syncState === 'busy' || syncCooldown > 0}
                  >
                    <CloudUpload size={16} />
                    {syncState === 'busy' ? 'İşleniyor...' : syncState === 'done' ? 'Tamamlandı' : syncState === 'error' ? 'Hata oluştu' : 'Upload Data'}
                  </button>
                </section>

                <section class="profile-section">
                  <h3>
                    <Trash2 size={16} />
                    Tüm İlerlemeyi Sil
                  </h3>
                  <p class="profile-action-desc">
                    Tüm kelime ilerlemesi, istatistikler ve seri bilgisi silinir. Bu işlem geri alınamaz.
                  </p>
                  <button
                    class="profile-btn profile-btn--full profile-btn--danger"
                    onClick={() => {
                      if (confirm('Tüm ilerleme silinecek. Emin misiniz?')) {
                        resetData();
                        onDataImported?.();
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Tüm İlerlemeyi Sil
                  </button>
                </section>

                <section class="profile-section">
                  <button class="profile-btn profile-btn--full profile-btn--danger" onClick={onSignOut}>
                    <LogOut size={16} />
                    Sign out
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
                Theme
              </h3>
              <div class="profile-theme-toggle">
                <button
                  class={`profile-theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => theme === 'dark' && onToggleTheme()}
                >
                  <Sun size={16} />
                  Light
                </button>
                <button
                  class={`profile-theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => theme === 'light' && onToggleTheme()}
                >
                  <Moon size={16} />
                  Dark
                </button>
              </div>
            </section>

            <section class="profile-section">
              <h3>
                <Download size={16} />
                Data
              </h3>
              <div class="profile-data-actions">
                <button class="profile-btn" onClick={handleExport}>
                  <Download size={16} />
                  Export
                </button>
                <button class="profile-btn" onClick={handleImportClick}>
                  <Upload size={16} />
                  Import
                </button>
              </div>
            </section>

            <div class="profile-visitor-footer">
              <Users size={13} />
              {visitorCount !== null
                ? <span>{visitorCount.toLocaleString()} {visitorCount === 1 ? 'visitor' : 'visitors'}</span>
                : <span class="visitor-loading">···</span>
              }
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
