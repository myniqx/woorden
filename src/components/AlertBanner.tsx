import { t } from '../data/translations';
import { useLanguage } from '../hooks';
import { Button } from './commons';

export type AlertAction = 'signIn' | 'goToProfile' | null;

export interface AlertDef {
  key: string;
  action?: AlertAction;
}

export const ALERTS: AlertDef[] = [
  { key: 'alert_leaderboard_promo', action: 'goToProfile' },
];

const STORAGE_KEY = 'woorden_alerts_seen';

function getSeenAlerts(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markAllSeen(keys: string[]): void {
  const seen = getSeenAlerts();
  for (const key of keys) seen[key] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

interface AlertBannerProps {
  onAction: (action: AlertAction) => void;
}

export function AlertBanner({ onAction }: AlertBannerProps) {
  const { language } = useLanguage();
  const seen = getSeenAlerts();
  const visible = ALERTS.filter((a) => !seen[a.key]);

  if (!visible.length) return null;

  const handleDismiss = () => {
    markAllSeen(visible.map((a) => a.key));
    onAction(null);
  };

  const handleAction = (alert: AlertDef) => {
    markAllSeen([alert.key]);
    onAction(alert.action ?? null);
  };

  return (
    <div class="mx-(--spacing-md) mt-(--spacing-sm) border-l-[3px] border-l-primary rounded-r-sm px-(--spacing-md) py-(--spacing-sm) bg-transparent">
      <ul class="m-0 p-0 list-none flex flex-col gap-(--spacing-sm)">
        {visible.map((a) => (
          <li key={a.key} class="flex flex-col gap-1">
            <span class="text-(length:--text-sm) text-text-secondary leading-relaxed">
              {t(a.key, language)}
            </span>
            {a.action && (
              <div class="flex justify-end">
                <Button variant="outline" color="primary" size="sm" onClick={() => handleAction(a)}>
                  {t(`alert_action_${a.action}`, language)}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div class="mt-(--spacing-sm) pt-(--spacing-sm) border-t border-t-border flex justify-start">
        <Button variant="outline" color="muted" size="sm" onClick={handleDismiss}>
          {t('alert_dismiss', language)}
        </Button>
      </div>
    </div>
  );
}
