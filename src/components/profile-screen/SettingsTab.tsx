import { useRef } from 'preact/hooks';
import { Sun, Moon, Download, Upload, Users } from 'lucide-preact';
import { exportData, importData } from '../../services/storage';
import { APP_URL } from '../../data/constants';
import { useTheme, useLanguage } from '../../hooks';
import { Button } from '../commons';

interface SettingsTabProps {
  visitorCount: number | null;
  onDataImported?: () => void;
}

export function SettingsTab({ visitorCount, onDataImported }: SettingsTabProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const sectionH3 = 'flex items-center gap-1 m-0 mb-4 text-[length:var(--text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.05em]';

  return (
    <div class="flex flex-col gap-8">
      <section>
        <h3 class={sectionH3}>
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          {t.profileScreen.settings.theme}
        </h3>
        <div class="flex gap-2">
          <Button variant={theme === 'light' ? 'soft' : 'outline'} color={theme === 'light' ? 'primary' : 'default'} icon={Sun} fullWidth onClick={() => theme === 'dark' && toggleTheme()}>
            {t.profileScreen.settings.light}
          </Button>
          <Button variant={theme === 'dark' ? 'soft' : 'outline'} color={theme === 'dark' ? 'primary' : 'default'} icon={Moon} fullWidth onClick={() => theme === 'light' && toggleTheme()}>
            {t.profileScreen.settings.dark}
          </Button>
        </div>
      </section>

      <section>
        <h3 class={sectionH3}><Download size={16} />{t.profileScreen.settings.data}</h3>
        <div class="flex gap-2">
          <Button variant="outline" icon={Download} fullWidth onClick={handleExport}>{t.common.export}</Button>
          <Button variant="outline" icon={Upload} fullWidth onClick={() => fileInputRef.current?.click()}>{t.common.import}</Button>
        </div>
      </section>

      <div class="flex items-center justify-center gap-1.5 pt-4 border-t border-border text-(length:--text-xs) text-text-muted">
        <Users size={13} />
        {visitorCount !== null
          ? <span>{visitorCount.toLocaleString()} {visitorCount === 1 ? t.profileScreen.settings.visitor : t.profileScreen.settings.visitors}</span>
          : <span class="tracking-[2px]">···</span>
        }
      </div>

      <div class="flex items-center justify-center gap-2 pt-2 text-(length:--text-xs)">
        <a class="text-text-muted no-underline hover:text-primary" href="/privacy" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Privacy Policy</a>
        <span class="text-border">·</span>
        <a class="text-text-muted no-underline hover:text-primary" href="/terms" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/terms'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Terms of Service</a>
        <span class="text-border">·</span>
        <a class="text-text-muted no-underline hover:text-primary" href={APP_URL} target="_blank" rel="noopener noreferrer">myniqx.dev</a>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}
