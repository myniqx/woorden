import { t } from '../data/translations';
import { useLanguage } from '../hooks';
import { Button } from './commons';
import './AlertBanner.css';

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
    <div class="alert-banner">
      <ul class="alert-banner-list">
        {visible.map((a) => (
          <li key={a.key} class="alert-banner-item">
            <span class="alert-banner-text">{t(a.key, language)}</span>
            {a.action && (
              <div class="alert-banner-item-action">
                <Button variant="outline" color="primary" size="sm" onClick={() => handleAction(a)}>
                  {t(`alert_action_${a.action}`, language)}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div class="alert-banner-footer">
        <Button variant="outline" color="muted" size="sm" onClick={handleDismiss}>
          {t('alert_dismiss', language)}
        </Button>
      </div>
    </div>
  );
}
