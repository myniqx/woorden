import type { User as AuthUser } from '../../services/auth';

export type Tab = 'leaderboard' | 'profile' | 'settings';

export interface SyncState {
  state: 'idle' | 'busy' | 'done' | 'error';
  cooldown: number;
  lastSync: string | null;
}

export interface ProfileSharedProps {
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}
