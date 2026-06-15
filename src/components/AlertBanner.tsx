import { useLanguage } from '../hooks';
import { Button } from './commons/Button';

export type AlertAction = 'signIn' | 'goToProfile' | null;

export interface AlertDef {
  id: string;
  action?: AlertAction;
}

export const ALERTS: AlertDef[] = [
  { id: 'leaderboard_promo', action: 'goToProfile' },
];

const STORAGE_KEY = 'woorden_alerts_seen';

function getSeenAlerts(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markAllSeen(ids: string[]): void {
  const seen = getSeenAlerts();
  for (const id of ids) seen[id] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

interface AlertBannerProps {
  onAction: (action: AlertAction) => void;
}

export function AlertBanner({ onAction }: AlertBannerProps) {
  const { t } = useLanguage();
  const seen = getSeenAlerts();
  const visible = ALERTS.filter((a) => !seen[a.id]);

  if (!visible.length) return null;

  const handleDismiss = () => {
    markAllSeen(visible.map((a) => a.id));
    onAction(null);
  };

  const handleAction = (alert: AlertDef) => {
    markAllSeen([alert.id]);
    onAction(alert.action ?? null);
  };

  const actionLabel = (action: AlertAction) => {
    if (action === 'goToProfile') return t.alert.goToProfile;
    if (action === 'signIn') return t.alert.signIn;
    return '';
  };

  return (
    <div class="mx-4 mt-2 border-l-[3px] border-l-primary rounded-r-sm px-4 py-2 bg-transparent">
      <ul class="m-0 p-0 list-none flex flex-col gap-2">
        {visible.map((a) => (
          <li key={a.id} class="flex flex-col gap-1">
            <span class="text-(length:--text-sm) text-text-secondary leading-relaxed">
              {t.alert.leaderboardPromo}
            </span>
            {a.action && (
              <div class="flex justify-end">
                <Button variant="outline" color="primary" size="sm" onClick={() => handleAction(a)}>
                  {actionLabel(a.action)}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div class="mt-2 pt-2 border-t border-t-border flex justify-start">
        <Button variant="outline" color="muted" size="sm" onClick={handleDismiss}>
          {t.common.dismiss}
        </Button>
      </div>
    </div>
  );
}
