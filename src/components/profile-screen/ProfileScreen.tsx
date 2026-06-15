import { useRef, useState, useEffect } from 'preact/hooks';
import { Trophy, User, Settings } from 'lucide-preact';
import { getUsername, setUsername, getAvatarIndex, setAvatarIndex, resetData } from '../../services/storage';
import { getRandomUsername } from '../../data/username-words';
import type { User as AuthUser } from '../../services/auth';
import { pushProfile, pullProfile, updateMyData, downloadData, fetchLeaderboard, UsernameConflictError } from '../../services/sync';
import type { LeaderboardEntry } from '../../services/sync';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
import { LeaderboardTab } from './LeaderboardTab';
import { ProfileTab } from './ProfileTab';
import { SettingsTab } from './SettingsTab';
import type { Tab, SyncState } from './types';

interface ProfileScreenProps {
  visitorCount: number | null;
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDataImported?: () => void;
}

const SYNC_COOLDOWN_MS = 15 * 60 * 1000;
const LAST_SYNC_KEY = 'woorden_last_sync';
const LEADERBOARD_CACHE_KEY = 'woorden_leaderboard_cache';
const LEADERBOARD_CACHE_TS_KEY = 'woorden_leaderboard_ts';

export function ProfileScreen({ visitorCount, user, onSignIn, onSignOut, onDataImported }: ProfileScreenProps) {
  const { language } = useLanguage();
  const tr = (key: string) => t(key, language);

  const [activeTab, setActiveTab] = useState<Tab>(user ? 'leaderboard' : 'profile');
  const [username, setUsernameState] = useState(getUsername);
  const [avatarIndex, setAvatarIndexState] = useState(getAvatarIndex);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [syncState, setSyncState] = useState<SyncState>({ state: 'idle', cooldown: 0, lastSync: null });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  const leaderboardFetched = useRef(false);
  const leaderboardTabOpened = useRef(false);
  const profileFetched = useRef(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds: number) => {
    setSyncState(s => ({ ...s, cooldown: seconds }));
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setSyncState(prev => {
        if (prev.cooldown <= 1) {
          clearInterval(cooldownTimer.current!);
          return { ...prev, cooldown: 0 };
        }
        return { ...prev, cooldown: prev.cooldown - 1 };
      });
    }, 1000);
  };

  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return;
    const elapsed = Date.now() - Number(stored);
    if (elapsed < SYNC_COOLDOWN_MS) {
      startCooldown(Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000));
    }
  }, []);

  const handleSyncAction = async (type: 'merge' | 'download' | 'upload') => {
    if (!user || syncState.state === 'busy' || syncState.cooldown > 0) return;
    setSyncState(s => ({ ...s, state: 'busy' }));
    try {
      if (type === 'merge') await updateMyData(user, 'merge');
      else if (type === 'download') await downloadData(user, 'override');
      else await updateMyData(user, 'override');
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      setSyncState(s => ({ ...s, state: 'done', lastSync: new Date().toISOString() }));
      startCooldown(SYNC_COOLDOWN_MS / 1000);
      setTimeout(() => setSyncState(s => ({ ...s, state: 'idle' })), 2000);
    } catch {
      setSyncState(s => ({ ...s, state: 'error' }));
      setTimeout(() => setSyncState(s => ({ ...s, state: 'idle' })), 3000);
    }
  };

  const loadLeaderboard = () => {
    if (leaderboardFetched.current) return;
    leaderboardFetched.current = true;

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
      setSyncState(s => ({ ...s, lastSync: remote.lastSync }));
    }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    const trimmed = username.trim();
    setUsername(trimmed);
    setAvatarIndex(avatarIndex);
    if (!user) return;
    setSaveState('saving');
    try {
      await pushProfile(user, trimmed, avatarIndex);
      setSaveState('saved');
      setSyncState(s => ({ ...s, lastSync: new Date().toISOString() }));
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      setSaveState(e instanceof UsernameConflictError ? 'conflict' : 'error');
      if (!(e instanceof UsernameConflictError)) setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleResetData = () => {
    if (confirm(tr('profile_delete_confirm'))) {
      resetData();
      onDataImported?.();
    }
  };

  const tabs: { id: Tab; icon: typeof Trophy; label: string }[] = [
    { id: 'leaderboard', icon: Trophy, label: tr('tab_leaderboard') },
    { id: 'profile', icon: User, label: tr('tab_profile') },
    { id: 'settings', icon: Settings, label: tr('tab_settings') },
  ];

  return (
    <div class="flex flex-col flex-1 min-h-0">
      <div class="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            class={`flex-1 flex items-center justify-center gap-[var(--spacing-xs)] px-[var(--spacing-sm)] py-[var(--spacing-md)] bg-transparent border-none border-b-2 -mb-px text-[length:var(--text-sm)] font-medium cursor-pointer transition-[color,border-color] duration-[var(--transition-fast)] ${activeTab === id ? 'text-[var(--color-primary)] border-b-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] border-b-transparent hover:text-[var(--color-text-primary)]'}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div class="flex-1 overflow-y-auto p-[var(--spacing-lg)]">
        {activeTab === 'leaderboard' && (
          <LeaderboardTab user={user} onSignIn={onSignIn} leaderboard={leaderboard} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            username={username}
            avatarIndex={avatarIndex}
            showAvatarPicker={showAvatarPicker}
            saveState={saveState}
            syncState={syncState}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onUsernameInput={(val) => { setUsernameState(val); setSaveState('idle'); }}
            onUsernameBlur={() => { setUsername(username.trim()); setUsernameState(username.trim()); }}
            onRandomUsername={() => { const name = getRandomUsername(); setUsernameState(name); setUsername(name); setSaveState('idle'); }}
            onAvatarPickerToggle={() => setShowAvatarPicker(v => !v)}
            onAvatarSelect={(index) => { setAvatarIndexState(index); setShowAvatarPicker(false); }}
            onSave={handleSave}
            onSyncAction={handleSyncAction}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab visitorCount={visitorCount} onDataImported={onDataImported} />
        )}
      </div>
    </div>
  );
}
