import { useRef } from 'preact/hooks';
import { X, Download, Upload } from 'lucide-preact';
import { exportData, importData } from '../services/storage';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported?: () => void;
  onPacksChanged?: () => void;
}

export function SettingsModal({ isOpen, onClose, onDataImported }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `woorden_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
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

  const handleOverlayClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('settings-modal-overlay')) {
      onClose();
    }
  };

  return (
    <div class="settings-modal-overlay" onClick={handleOverlayClick}>
      <div class="settings-modal">
        <div class="settings-modal-header">
          <h2>Settings</h2>
          <button class="settings-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div class="settings-modal-content">
          <section class="settings-section">
            <h3>
              <Download size={18} />
              Data Management
            </h3>
            <div class="data-actions">
              <button class="data-btn" onClick={handleExport}>
                <Download size={16} />
                Export Data
              </button>
              <button class="data-btn" onClick={handleImportClick}>
                <Upload size={16} />
                Import Data
              </button>
            </div>
          </section>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
