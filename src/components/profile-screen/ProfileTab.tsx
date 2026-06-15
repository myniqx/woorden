import { User, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle } from 'lucide-preact';
import { Avatar, AvatarPicker } from '../AvatarPicker';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
import { Button } from '../commons';
import type { ProfileSharedProps, SyncState } from './types';

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
      <div class="profile-section-list">
        <section class="profile-section">
          <h3><User size={16} />{tr('profile_account')}</h3>
          <div class="profile-signin-prompt">
            <ul class="profile-signin-reasons">
              <li>{tr('profile_signin_reason1')}</li>
              <li>{tr('profile_signin_reason2')}</li>
            </ul>
            <Button variant="outline" color="primary" icon={LogIn} fullWidth onClick={onSignIn}>
              {tr('lb_signin_google')}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const saveColor = saveState === 'error' || saveState === 'conflict' ? 'danger' : 'primary';
  const syncColor = state === 'error' ? 'danger' : 'default';

  return (
    <div class="profile-section-list">
      <section class="profile-section">
        <div class="profile-avatar-row">
          <div class="profile-avatar-display">
            <Avatar index={avatarIndex} size={72} />
          </div>
          <div class="profile-avatar-meta">
            <span class="profile-email">{user.email}</span>
            <Button variant="outline" size="sm" onClick={onAvatarPickerToggle}>
              {showAvatarPicker ? tr('profile_avatar_close') : tr('profile_avatar_change')}
            </Button>
          </div>
        </div>
        {showAvatarPicker && (
          <div class="profile-avatar-picker-wrap">
            <AvatarPicker selectedIndex={avatarIndex} onSelect={onAvatarSelect} />
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
            onInput={(e) => onUsernameInput((e.target as HTMLInputElement).value)}
            onBlur={onUsernameBlur}
            maxLength={24}
          />
          <Button variant="ghost" size="sm" icon={Shuffle} onClick={onRandomUsername} title="Rastgele kullanıcı adı üret" />
        </div>
        {saveState === 'conflict' && (
          <p class="profile-input-error">{tr('profile_username_taken')}</p>
        )}
      </section>

      <section class="profile-section">
        <Button
          variant="soft"
          color={saveColor}
          icon={Save}
          fullWidth
          onClick={onSave}
          disabled={saveState === 'saving' || !username.trim()}
        >
          {saveState === 'saving' ? tr('profile_saving') :
           saveState === 'saved' ? tr('profile_saved') :
           saveState === 'error' ? tr('profile_error') :
           tr('profile_save')}
        </Button>
      </section>

      {lastSync && (
        <p class="profile-last-sync">
          {tr('profile_last_sync', { date: new Date(lastSync).toLocaleString() })}
        </p>
      )}

      {cooldown > 0 && (
        <p class="profile-sync-cooldown">
          {tr('profile_next_action', { time: `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}` })}
        </p>
      )}

      <section class="profile-section">
        <h3><RefreshCw size={16} />{tr('profile_sync_data')}</h3>
        <p class="profile-action-desc">{tr('profile_sync_desc')}</p>
        <Button variant="outline" color={syncColor} icon={RefreshCw} fullWidth disabled={isBusy} onClick={() => onSyncAction('merge')}>
          {syncLabel('profile_sync_data')}
        </Button>
      </section>

      <section class="profile-section">
        <h3><CloudDownload size={16} />{tr('profile_get_data')}</h3>
        <p class="profile-action-desc">{tr('profile_get_desc')}</p>
        <Button variant="outline" color={syncColor} icon={CloudDownload} fullWidth disabled={isBusy} onClick={() => onSyncAction('download')}>
          {syncLabel('profile_get_data')}
        </Button>
      </section>

      <section class="profile-section">
        <h3><CloudUpload size={16} />{tr('profile_upload_data')}</h3>
        <p class="profile-action-desc">{tr('profile_upload_desc')}</p>
        <Button variant="outline" color={syncColor} icon={CloudUpload} fullWidth disabled={isBusy} onClick={() => onSyncAction('upload')}>
          {syncLabel('profile_upload_data')}
        </Button>
      </section>

      <section class="profile-section">
        <h3><Trash2 size={16} />{tr('profile_delete_all')}</h3>
        <p class="profile-action-desc">{tr('profile_delete_desc')}</p>
        <Button variant="outline" color="danger" icon={Trash2} fullWidth onClick={onResetData}>
          {tr('profile_delete_all')}
        </Button>
      </section>

      <section class="profile-section">
        <Button variant="outline" color="danger" icon={LogOut} fullWidth onClick={onSignOut}>
          {tr('profile_signout')}
        </Button>
      </section>
    </div>
  );
}
