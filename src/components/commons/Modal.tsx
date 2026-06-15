import type { ComponentChildren } from 'preact';
import { X } from 'lucide-preact';
import { Button } from './Button';

type MaxWidth = 'sm' | 'md' | 'lg';

const maxWidthMap: Record<MaxWidth, string> = {
  sm: 'max-w-[360px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[500px]',
};

interface ModalProps {
  onClose: () => void;
  maxWidth?: MaxWidth;
  children: ComponentChildren;
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  children?: ComponentChildren;
}

interface ModalBodyProps {
  children: ComponentChildren;
  class?: string;
}

function ModalHeader({ title, onClose, children }: ModalHeaderProps) {
  return (
    <div class="flex items-center justify-between px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-[var(--color-border)]">
      <div class="flex-1 min-w-0">
        {typeof title === 'string'
          ? <h2 class="m-0 text-[length:var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          : title}
      </div>
      <div class="flex items-center gap-[var(--spacing-xs)]">
        {children}
        <Button variant="ghost" icon={X} size="icon" onClick={onClose} aria-label="Close" />
      </div>
    </div>
  );
}

function ModalBody({ children, class: className = '' }: ModalBodyProps) {
  return (
    <div class={`flex-1 overflow-y-auto p-[var(--spacing-md)] ${className}`}>
      {children}
    </div>
  );
}

export function Modal({ onClose, maxWidth = 'md', children }: ModalProps) {
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-[var(--spacing-md)] z-[1000]"
      onClick={handleOverlayClick}
    >
      <div class={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] w-full ${maxWidthMap[maxWidth]} max-h-[80vh] flex flex-col overflow-hidden shadow-[var(--shadow-lg)] scale-in`}>
        {children}
      </div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
