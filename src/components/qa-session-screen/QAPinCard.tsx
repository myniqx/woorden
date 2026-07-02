import { useState } from 'preact/hooks';
import { Trash2, Check } from 'lucide-preact';
import { Markdown } from '../commons';
import { useLanguage } from '../../hooks';
import type { QAPin } from './types';

interface Props {
  pin: QAPin;
  onDelete: (id: string) => void;
}

export function QAPinCard({ pin, onDelete }: Props) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = () => {
    if (confirming) {
      onDelete(pin.id);
      return;
    }
    setConfirming(true);
  };

  return (
    <div class="relative flex flex-col gap-2 p-4 bg-surface border border-border rounded-xl">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-semibold text-text-primary m-0">{pin.title}</h3>
        <button
          class={`shrink-0 p-1 bg-transparent border-none cursor-pointer transition-colors duration-(--transition-fast) ${confirming ? 'text-error' : 'text-text-muted hover:text-error'}`}
          onClick={handleDeleteClick}
          onBlur={() => setConfirming(false)}
          title={confirming ? t.qa.deletePinConfirm : undefined}
        >
          {confirming ? <Check size={15} /> : <Trash2 size={15} />}
        </button>
      </div>
      <div class="text-sm text-text-secondary">
        <Markdown content={pin.answer} class="text-sm" />
      </div>
    </div>
  );
}
