import { User, LogIn, LogOut, RefreshCw, CloudDownload, CloudUpload, Save, Trash2, Shuffle } from 'lucide-preact';
import { Avatar, AvatarPicker } from '../AvatarPicker';
import { t } from '../../data/translations';
import { useLanguage } from '../../hooks';
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
            <button class="profile-btn profile-btn--full" onClick={onSignIn}>
              <LogIn size={16} />
              {tr('lb_signin_google')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div class="profile-section-list">
      <section class="profile-section">
        <div class="profile-avatar-row">
          <div class="profile-avatar-display">
            <Avatar index={avatarIndex} size={72} />
          </div>
          <div class="profile-avatar-meta">
            <span class="profile-email">{user.email}</span>
            <button class="profile-btn profile-btn--sm" onClick={onAvatarPickerToggle}>
              {showAvatarPicker ? tr('profile_avatar_close') : tr('profile_avatar_change')}
            </button>
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
          <button class="profile-btn profile-btn--sm" onClick={onRandomUsername} title="Rastgele kullanıcı adı üret">
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
          onClick={onSave}
          disabled={saveState === 'saving' || !username.trim()}
        >
          <Save size={16} />
          {saveState === 'saving' ? tr('profile_saving') :
           saveState === 'saved' ? tr('profile_saved') :
           saveState === 'error' ? tr('profile_error') :
           tr('profile_save')}
        </button>
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
        <button
          class={`profile-btn profile-btn--full${state === 'error' ? ' profile-btn--danger' : ''}`}
          onClick={() => onSyncAction('merge')}
          disabled={isBusy}
        >
          <RefreshCw size={16} />
          {syncLabel('profile_sync_data')}
        </button>
      </section>

      <section class="profile-section">
        <h3><CloudDownload size={16} />{tr('profile_get_data')}</h3>
        <p class="profile-action-desc">{tr('profile_get_desc')}</p>
        <button
          class={`profile-btn profile-btn--full${state === 'error' ? ' profile-btn--danger' : ''}`}
          onClick={() => onSyncAction('download')}
          disabled={isBusy}
        >
          <CloudDownload size={16} />
          {syncLabel('profile_get_data')}
        </button>
      </section>

      <section class="profile-section">
        <h3><CloudUpload size={16} />{tr('profile_upload_data')}</h3>
        <p class="profile-action-desc">{tr('profile_upload_desc')}</p>
        <button
          class={`profile-btn profile-btn--full${state === 'error' ? ' profile-btn--danger' : ''}`}
          onClick={() => onSyncAction('upload')}
          disabled={isBusy}
        >
          <CloudUpload size={16} />
          {syncLabel('profile_upload_data')}
        </button>
      </section>

      <section class="profile-section">
        <h3><Trash2 size={16} />{tr('profile_delete_all')}</h3>
        <p class="profile-action-desc">{tr('profile_delete_desc')}</p>
        <button
          class="profile-btn profile-btn--full profile-btn--danger"
          onClick={onResetData}
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
    </div>
  );
}
