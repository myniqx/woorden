import { useState, useRef, useEffect } from 'preact/hooks';
import { LogIn, LogOut, User } from 'lucide-preact';
import type { User as AuthUser } from '../services/auth';
import './AuthButton.css';

interface AuthButtonProps {
  user: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function AuthButton({ user, onSignIn, onSignOut }: AuthButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div class="auth-button-wrapper" ref={ref}>
      <button
        class={`header-btn auth-avatar-btn ${user ? 'logged-in' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Account"
      >
        {user
          ? (user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} class="auth-avatar-img" alt="avatar" />
              : <User size={18} />)
          : <User size={18} />
        }
      </button>

      {open && (
        <div class="auth-popup">
          {user ? (
            <>
              <p class="auth-popup-email">{user.email}</p>
              <button class="auth-popup-btn auth-popup-btn--danger" onClick={() => { onSignOut(); setOpen(false); }}>
                <LogOut size={15} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <p class="auth-popup-desc">
                Sign in to sync your progress across devices.
              </p>
              <button class="auth-popup-btn auth-popup-btn--primary" onClick={() => { onSignIn(); setOpen(false); }}>
                <LogIn size={15} />
                Sign in with Google
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
