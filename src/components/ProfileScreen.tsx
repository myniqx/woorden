import { useRef, useState, useEffect } from 'preact/hooks';
import { Trophy, User, Settings, Sun, Moon, Download, Upload, Users, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2 } from 'lucide-preact';
import { exportData, importData, getUsername, setUsername, getAvatarIndex, setAvatarIndex, resetData } from '../services/storage';
import type { User as AuthUser } from '../services/auth';
import { pushProfile, pullProfile, UsernameConflictError } from '../services/sync';
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
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [username, setUsernameState] = useState(getUsername);
  const [avatarIndex, setAvatarIndexState] = useState(getAvatarIndex);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFetched = useRef(false);

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
        {activeTab === 'leaderboard' && (
          <div class="profile-placeholder">
            <Trophy size={48} />
            <p>Leaderboard coming soon</p>
          </div>
        )}

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
                  <input
                    class={`profile-username-input${saveState === 'conflict' ? ' profile-username-input--error' : ''}`}
                    type="text"
                    placeholder="Kullanıcı adınız"
                    value={username}
                    onInput={(e) => { setUsernameState((e.target as HTMLInputElement).value); setSaveState('idle'); }}
                    onBlur={handleUsernameBlur}
                    maxLength={24}
                  />
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

                <section class="profile-section">
                  <h3>
                    <RefreshCw size={16} />
                    Sync Data
                  </h3>
                  <p class="profile-action-desc">
                    Sunucudaki veriyi çeker, yerel veriyle birleştirir ve tekrar yükler. Her iki taraf da aynı veriye sahip olur.
                  </p>
                  <button class="profile-btn profile-btn--full">
                    <RefreshCw size={16} />
                    Sync Data
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
                  <button class="profile-btn profile-btn--full">
                    <CloudDownload size={16} />
                    Get Data
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
                  <button class="profile-btn profile-btn--full">
                    <CloudUpload size={16} />
                    Upload Data
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
