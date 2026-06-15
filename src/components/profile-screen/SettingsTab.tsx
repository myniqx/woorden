import { useRef } from 'preact/hooks';
import { Sun, Moon, Download, Upload, Users } from 'lucide-preact';
import { exportData, importData } from '../../services/storage';
import { APP_URL } from '../../data/constants';
import { t } from '../../data/translations';
import { useLanguage, useTheme } from '../../hooks';

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

  return (
    <div class="profile-section-list">
      <section class="profile-section">
        <h3>
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          {tr('settings_theme')}
        </h3>
        <div class="profile-theme-toggle">
          <button
            class={`profile-theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => theme === 'dark' && toggleTheme()}
          >
            <Sun size={16} />
            {tr('settings_light')}
          </button>
          <button
            class={`profile-theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => theme === 'light' && toggleTheme()}
          >
            <Moon size={16} />
            {tr('settings_dark')}
          </button>
        </div>
      </section>

      <section class="profile-section">
        <h3><Download size={16} />{tr('settings_data')}</h3>
        <div class="profile-data-actions">
          <button class="profile-btn" onClick={handleExport}>
            <Download size={16} />
            {tr('settings_export')}
          </button>
          <button class="profile-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            {tr('settings_import')}
          </button>
        </div>
      </section>

      <div class="profile-visitor-footer">
        <Users size={13} />
        {visitorCount !== null
          ? <span>{visitorCount.toLocaleString()} {visitorCount === 1 ? tr('settings_visitor') : tr('settings_visitors')}</span>
          : <span class="visitor-loading">···</span>
        }
      </div>

      <div class="profile-legal-links">
        <a href="/privacy" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Privacy Policy</a>
        <span class="profile-legal-sep">·</span>
        <a href="/terms" onClick={(e) => { e.preventDefault(); history.pushState({}, '', '/terms'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Terms of Service</a>
        <span class="profile-legal-sep">·</span>
        <a href={APP_URL} target="_blank" rel="noopener noreferrer">myniqx.dev</a>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}
