import { User, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { Avatar, AvatarPicker } from '../AvatarPicker';
import { Button } from '../commons';
import type { ProfileSharedProps, SyncState } from './types';
import { useLanguage } from '@/hooks';

const sectionH3 = 'flex items-center gap-1 m-0 mb-4 text-[length:var(--text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.05em]';
const sectionList = 'flex flex-col gap-8';
const actionDesc = 'm-0 mb-2 text-[length:var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed';

function Section({ children }: { children: ComponentChildren }) {
  return <section class="profile-section">{children}</section>;
}

interface ProfileTabProps extends ProfileSharedProps {
  username: string;
  avatarIndex: number;
  showAvatarPicker: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  syncState: SyncState;
  onUsernameInput: (val: string) => void;
  onUsernameBlur: () => void;
  onRandomUsername: () => void;
  onAvatarPickerToggle: () => void;
  onAvatarSelect: (index: number) => void;
  onSave: () => void;
  onSyncAction: (type: 'merge' | 'download' | 'upload') => void;
  onResetData: () => void;
}

export function ProfileTab({
  user,
  username,
  avatarIndex,
  showAvatarPicker,
  saveState,
  syncState,
  onSignIn,
  onSignOut,
  onUsernameInput,
  onUsernameBlur,
  onRandomUsername,
  onAvatarPickerToggle,
  onAvatarSelect,
  onSave,
  onSyncAction,
  onResetData,
}: ProfileTabProps) {
  const { t, merge } = useLanguage();
  const { state, cooldown, lastSync } = syncState;
  const isBusy = state === 'busy' || cooldown > 0;

  const syncLabel = (fallback: string) =>
    state === 'busy' ? t.common.processing :
      state === 'done' ? t.common.done :
        state === 'error' ? t.common.error :
          fallback;

  if (!user) {
    return (
      <div class={sectionList}>
        <Section>
          <h3 class={sectionH3}><User size={16} />{t.profileScreen.profile.account}</h3>
          <div class="flex flex-col gap-4">
            <ul class="m-0 pl-4 flex flex-col gap-1 text-[var(--color-text-secondary)] text-[length:var(--text-sm)] leading-relaxed">
              <li>{t.profileScreen.profile.signinReason1}</li>
              <li>{t.profileScreen.profile.signinReason2}</li>
            </ul>
            <Button variant="outline" color="primary" icon={LogIn} fullWidth onClick={onSignIn}>
              {t.leaderboard.signInGoogle}
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  const saveColor = saveState === 'error' || saveState === 'conflict' ? 'danger' : 'primary';
  const syncColor = state === 'error' ? 'danger' : 'default';

  const inputBase = 'w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] text-[length:var(--text-sm)] transition-[border-color] duration-[var(--transition-fast)] outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)] box-border';

  return (
    <div class={sectionList}>
      <Section>
        <div class="flex items-center gap-4">
          <div class="shrink-0 w-[72px] h-[72px] rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-border)] flex items-center justify-center overflow-hidden">
            <Avatar index={avatarIndex} size={72} />
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] truncate">{user.email}</span>
            <Button variant="outline" size="sm" onClick={onAvatarPickerToggle}>
              {showAvatarPicker ? t.common.close : t.common.change}
            </Button>
          </div>
        </div>
        {showAvatarPicker && (
          <div class="mt-4">
            <AvatarPicker selectedIndex={avatarIndex} onSelect={onAvatarSelect} />
          </div>
        )}
      </Section>

      <Section>
        <h3 class={sectionH3}>{t.profileScreen.profile.username}</h3>
        <div class="flex gap-2 items-center">
          <input
            class={`${inputBase} flex-1 ${saveState === 'conflict' ? 'border-[var(--color-error)] focus:border-[var(--color-error)]' : ''}`}
            type="text"
            placeholder={t.profileScreen.profile.usernamePlaceholder}
            value={username}
            onInput={(e) => onUsernameInput((e.target as HTMLInputElement).value)}
            onBlur={onUsernameBlur}
            maxLength={24}
          />
          <Button variant="ghost" size="sm" icon={Shuffle} onClick={onRandomUsername} title="Rastgele kullanıcı adı üret" />
        </div>
        {saveState === 'conflict' && (
          <p class="mt-1 m-0 text-[length:var(--text-xs)] text-[var(--color-error)]">{t.profileScreen.profile.usernameTaken}</p>
        )}
      </Section>

      <Section>
        <Button variant="soft" color={saveColor} icon={Save} fullWidth onClick={onSave} disabled={saveState === 'saving' || !username.trim()}>
          {saveState === 'saving' ? t.common.saving :
            saveState === 'saved' ? t.common.saved :
              saveState === 'error' ? t.common.error :
                t.common.save}
        </Button>
      </Section>

      {lastSync && (
        <p class="m-0 mb-4 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
          {merge(t.profileScreen.profile.lastSync, { date: new Date(lastSync).toLocaleString() })}
        </p>
      )}

      {cooldown > 0 && (
        <p class="m-0 mb-4 text-[length:var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
          {merge(t.profileScreen.profile.nextAction, { time: `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}` })}
        </p>
      )}

      <Section>
        <h3 class={sectionH3}><RefreshCw size={16} />{t.profileScreen.profile.syncData}</h3>
        <p class={actionDesc}>{t.profileScreen.profile.syncDesc}</p>
        <Button variant="outline" color={syncColor} icon={RefreshCw} fullWidth disabled={isBusy} onClick={() => onSyncAction('merge')}>
          {syncLabel(t.profileScreen.profile.syncData)}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><CloudDownload size={16} />{t.profileScreen.profile.getData}</h3>
        <p class={actionDesc}>{t.profileScreen.profile.getDesc}</p>
        <Button variant="outline" color={syncColor} icon={CloudDownload} fullWidth disabled={isBusy} onClick={() => onSyncAction('download')}>
          {syncLabel(t.profileScreen.profile.getData)}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><CloudUpload size={16} />{t.profileScreen.profile.uploadData}</h3>
        <p class={actionDesc}>{t.profileScreen.profile.uploadDesc}</p>
        <Button variant="outline" color={syncColor} icon={CloudUpload} fullWidth disabled={isBusy} onClick={() => onSyncAction('upload')}>
          {syncLabel(t.profileScreen.profile.uploadData)}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><Trash2 size={16} />{t.profileScreen.profile.deleteAll}</h3>
        <p class={actionDesc}>{t.profileScreen.profile.deleteDesc}</p>
        <Button variant="outline" color="danger" icon={Trash2} fullWidth onClick={onResetData}>
          {t.profileScreen.profile.deleteAll}
        </Button>
      </Section>

      <Section>
        <Button variant="outline" color="danger" icon={LogOut} fullWidth onClick={onSignOut}>
          {t.common.signOut}
        </Button>
      </Section>
    </div>
  );
}
