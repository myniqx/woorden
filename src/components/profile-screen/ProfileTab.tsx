import { User, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { Avatar, AvatarPicker } from '../AvatarPicker';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
import { Button } from '../commons';
import type { ProfileSharedProps, SyncState } from './types';

const sectionH3 = 'flex items-center gap-[var(--spacing-xs)] m-0 mb-[var(--spacing-md)] text-[length:var(--text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.05em]';
const sectionList = 'flex flex-col gap-[var(--spacing-xl)]';
const actionDesc = 'm-0 mb-[var(--spacing-sm)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed';

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
  const { language } = useLanguage();
  const tr = (key: string, replacements?: Record<string, string | number>) => t(key, language, replacements);

  const { state, cooldown, lastSync } = syncState;
  const isBusy = state === 'busy' || cooldown > 0;
  const syncLabel = (fallback: string) =>
    state === 'busy' ? tr('profile_processing') :
    state === 'done' ? tr('profile_done') :
    state === 'error' ? tr('profile_action_error') :
    tr(fallback);

  if (!user) {
    return (
      <div class={sectionList}>
        <Section>
          <h3 class={sectionH3}><User size={16} />{tr('profile_account')}</h3>
          <div class="flex flex-col gap-[var(--spacing-md)]">
            <ul class="m-0 pl-[var(--spacing-md)] flex flex-col gap-[var(--spacing-xs)] text-[var(--color-text-secondary)] text-[length:var(--text-sm)] leading-relaxed">
              <li>{tr('profile_signin_reason1')}</li>
              <li>{tr('profile_signin_reason2')}</li>
            </ul>
            <Button variant="outline" color="primary" icon={LogIn} fullWidth onClick={onSignIn}>
              {tr('lb_signin_google')}
            </Button>
          </div>
        </Section>
      </div>
    );
  }

  const saveColor = saveState === 'error' || saveState === 'conflict' ? 'danger' : 'primary';
  const syncColor = state === 'error' ? 'danger' : 'default';

  const inputBase = 'w-full px-[var(--spacing-md)] py-[var(--spacing-sm)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] text-[length:var(--text-sm)] transition-[border-color] duration-[var(--transition-fast)] outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)] box-border';

  return (
    <div class={sectionList}>
      <Section>
        <div class="flex items-center gap-[var(--spacing-md)]">
          <div class="shrink-0 w-[72px] h-[72px] rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-border)] flex items-center justify-center overflow-hidden">
            <Avatar index={avatarIndex} size={72} />
          </div>
          <div class="flex flex-col gap-[var(--spacing-xs)] min-w-0">
            <span class="text-[length:var(--text-sm)] text-[var(--color-text-secondary)] truncate">{user.email}</span>
            <Button variant="outline" size="sm" onClick={onAvatarPickerToggle}>
              {showAvatarPicker ? tr('profile_avatar_close') : tr('profile_avatar_change')}
            </Button>
          </div>
        </div>
        {showAvatarPicker && (
          <div class="mt-[var(--spacing-md)]">
            <AvatarPicker selectedIndex={avatarIndex} onSelect={onAvatarSelect} />
          </div>
        )}
      </Section>

      <Section>
        <h3 class={sectionH3}>{tr('profile_username')}</h3>
        <div class="flex gap-[var(--spacing-sm)] items-center">
          <input
            class={`${inputBase} flex-1 ${saveState === 'conflict' ? 'border-[var(--color-error)] focus:border-[var(--color-error)]' : ''}`}
            type="text"
            placeholder={tr('profile_username_placeholder')}
            value={username}
            onInput={(e) => onUsernameInput((e.target as HTMLInputElement).value)}
            onBlur={onUsernameBlur}
            maxLength={24}
          />
          <Button variant="ghost" size="sm" icon={Shuffle} onClick={onRandomUsername} title="Rastgele kullanıcı adı üret" />
        </div>
        {saveState === 'conflict' && (
          <p class="mt-[var(--spacing-xs)] m-0 text-[length:var(--text-xs)] text-[var(--color-error)]">{tr('profile_username_taken')}</p>
        )}
      </Section>

      <Section>
        <Button variant="soft" color={saveColor} icon={Save} fullWidth onClick={onSave} disabled={saveState === 'saving' || !username.trim()}>
          {saveState === 'saving' ? tr('profile_saving') :
           saveState === 'saved'  ? tr('profile_saved')  :
           saveState === 'error'  ? tr('profile_error')  :
           tr('profile_save')}
        </Button>
      </Section>

      {lastSync && (
        <p class="m-0 mb-[var(--spacing-md)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
          {tr('profile_last_sync', { date: new Date(lastSync).toLocaleString() })}
        </p>
      )}

      {cooldown > 0 && (
        <p class="m-0 mb-[var(--spacing-md)] text-[length:var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
          {tr('profile_next_action', { time: `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}` })}
        </p>
      )}

      <Section>
        <h3 class={sectionH3}><RefreshCw size={16} />{tr('profile_sync_data')}</h3>
        <p class={actionDesc}>{tr('profile_sync_desc')}</p>
        <Button variant="outline" color={syncColor} icon={RefreshCw} fullWidth disabled={isBusy} onClick={() => onSyncAction('merge')}>
          {syncLabel('profile_sync_data')}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><CloudDownload size={16} />{tr('profile_get_data')}</h3>
        <p class={actionDesc}>{tr('profile_get_desc')}</p>
        <Button variant="outline" color={syncColor} icon={CloudDownload} fullWidth disabled={isBusy} onClick={() => onSyncAction('download')}>
          {syncLabel('profile_get_data')}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><CloudUpload size={16} />{tr('profile_upload_data')}</h3>
        <p class={actionDesc}>{tr('profile_upload_desc')}</p>
        <Button variant="outline" color={syncColor} icon={CloudUpload} fullWidth disabled={isBusy} onClick={() => onSyncAction('upload')}>
          {syncLabel('profile_upload_data')}
        </Button>
      </Section>

      <Section>
        <h3 class={sectionH3}><Trash2 size={16} />{tr('profile_delete_all')}</h3>
        <p class={actionDesc}>{tr('profile_delete_desc')}</p>
        <Button variant="outline" color="danger" icon={Trash2} fullWidth onClick={onResetData}>
          {tr('profile_delete_all')}
        </Button>
      </Section>

      <Section>
        <Button variant="outline" color="danger" icon={LogOut} fullWidth onClick={onSignOut}>
          {tr('profile_signout')}
        </Button>
      </Section>
    </div>
  );
}
