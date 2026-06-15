import { useRef } from 'preact/hooks';
import { Sun, Moon, Download, Upload, Users } from 'lucide-preact';
import { exportData, importData } from '../../services/storage';
import { APP_URL } from '../../data/constants';
import { t } from '../../data/translations';
import { useLanguage, useTheme } from '../../hooks';
import { Button } from '../commons';

interface SettingsTabProps {
  visitorCount: number | null;
  onDataImported?: () => void;
}

export function SettingsTab({ visitorCount, onDataImported }: SettingsTabProps) {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tr = (key: string) => t(key, language);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `woorden_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      if (result.success) {
        alert(result.message);
        onDataImported?.();
      } else {
        alert(`Import failed: ${result.message}`);
      }
    };
    reader.readAsText(file);
    target.value = '';
  };

  const sectionH3 = 'flex items-center gap-[var(--spacing-xs)] m-0 mb-[var(--spacing-md)] text-[length:var(--text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.05em]';

  return (
    <div class="flex flex-col gap-[var(--spacing-xl)]">
      <section>
        <h3 class={sectionH3}>
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          {tr('settings_theme')}
        </h3>
        <div class="flex gap-[var(--spacing-sm)]">
          <Button variant={theme === 'light' ? 'soft' : 'outline'} color={theme === 'light' ? 'primary' : 'default'} icon={Sun} fullWidth onClick={() => theme === 'dark' && toggleTheme()}>
            {tr('settings_light')}
          </Button>
          <Button variant={theme === 'dark' ? 'soft' : 'outline'} color={theme === 'dark' ? 'primary' : 'default'} icon={Moon} fullWidth onClick={() => theme === 'light' && toggleTheme()}>
            {tr('settings_dark')}
          </Button>
        </div>
      </section>

      <section>
        <h3 class={sectionH3}><Download size={16} />{tr('settings_data')}</h3>
        <div class="flex gap-[var(--spacing-sm)]">
          <Button variant="outline" icon={Download} fullWidth onClick={handleExport}>{tr('settings_export')}</Button>
          <Button variant="outline" icon={Upload} fullWidth onClick={() => fileInputRef.current?.click()}>{tr('settings_import')}</Button>
        </div>
      </section>

      <div class="flex items-center justify-center gap-1.5 pt-[var(--spacing-md)] border-t border-[var(--color-border)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        <Users size={13} />
        {visitorCount !== null
          ? <span>{visitorCount.toLocaleString()} {visitorCount === 1 ? tr('settings_visitor') : tr('settings_visitors')}</span>
          : <span class="tracking-[2px]">···</span>
        }
      </div>

      <div class="flex items-center justify-center gap-[var(--spacing-sm)] pt-[var(--spacing-sm)] text-[length:var(--text-xs)]">
        <a class="text-[var(--color-text-muted)] no-underline hover:text-[var(--color-primary)]" href="/privacy" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Privacy Policy</a>
        <span class="text-[var(--color-border)]">·</span>
        <a class="text-[var(--color-text-muted)] no-underline hover:text-[var(--color-primary)]" href="/terms" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/terms'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Terms of Service</a>
        <span class="text-[var(--color-border)]">·</span>
        <a class="text-[var(--color-text-muted)] no-underline hover:text-[var(--color-primary)]" href={APP_URL} target="_blank" rel="noopener noreferrer">myniqx.dev</a>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}
