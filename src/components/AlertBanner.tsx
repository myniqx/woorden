import { useState } from 'preact/hooks';
import { useLanguage, useAppLayout } from '../hooks';
import { Button } from './commons/Button';
import type { Screen } from '../types';

export type AlertAction = 'signIn' | 'goToProfile' | 'goToAIChat' | null;

export interface AlertDef {
  id: string;
  action?: AlertAction;
  textKey: 'leaderboardPromo' | 'aiChatPromo';
}

export const ALERTS: AlertDef[] = [
  { id: 'leaderboard_promo', action: 'goToProfile', textKey: 'leaderboardPromo' },
  { id: 'ai_chat_promo', action: 'goToAIChat', textKey: 'aiChatPromo' },
];

const STORAGE_KEY = 'woorden_alerts_seen';

function getSeenAlerts(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markSeen(ids: string[]): void {
  const seen = getSeenAlerts();
  for (const id of ids) seen[id] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

export function AlertBanner() {
  const { t } = useLanguage();
  const { navigateTo } = useAppLayout();
  const [seen, setSeen] = useState(getSeenAlerts);

  const visible = ALERTS.filter((a) => !seen[a.id]);
  if (!visible.length) return null;

  const dismiss = (ids: string[]) => {
    markSeen(ids);
    setSeen(getSeenAlerts());
  };

  const handleAction = (alert: AlertDef) => {
    dismiss([alert.id]);
    if (alert.action === 'goToProfile' || alert.action === 'signIn') {
      history.pushState({ screen: 'profile' }, '');
      navigateTo('profile' as Screen);
    } else if (alert.action === 'goToAIChat') {
      history.pushState({ screen: 'ai-chat' }, '');
      navigateTo('ai-chat' as Screen);
    }
  };

  const actionLabel = (action: AlertAction) => {
    if (action === 'goToProfile') return t.alert.goToProfile;
    if (action === 'signIn') return t.alert.signIn;
    if (action === 'goToAIChat') return t.alert.goToAIChat;
    return '';
  };

  return (
    <div class="mx-4 mt-2 border-l-[3px] border-l-primary rounded-r-sm px-4 py-2 bg-transparent">
      <ul class="m-0 p-0 list-none flex flex-col gap-2">
        {visible.map((a) => (
          <li key={a.id} class="flex flex-col gap-1">
            <span class="text-sm text-text-secondary leading-relaxed">
              {t.alert[a.textKey]}
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
        <Button variant="outline" color="muted" size="sm" onClick={() => dismiss(visible.map(a => a.id))}>
          {t.common.dismiss}
        </Button>
      </div>
    </div>
  );
}
