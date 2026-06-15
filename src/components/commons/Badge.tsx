import type { ComponentChildren } from 'preact';
import type { LucideIcon } from 'lucide-preact';

type Variant = 'solid' | 'soft' | 'outline';
type Color = 'primary' | 'success' | 'error' | 'muted' | 'surface';
type Size = 'sm' | 'md';

interface BadgeProps {
  variant?: Variant;
  color?: Color;
  size?: Size;
  icon?: LucideIcon;
  dot?: boolean;
  children?: ComponentChildren;
  class?: string;
}

const colorMap: Record<Color, Record<Variant, string>> = {
  primary: {
    solid:   'bg-[var(--color-primary)] text-white border-[var(--color-primary)]',
    soft:    'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]',
    outline: 'bg-transparent text-[var(--color-primary)] border-[var(--color-primary)]',
  },
  success: {
    solid:   'bg-[var(--color-success)] text-white border-[var(--color-success)]',
    soft:    'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]',
    outline: 'bg-transparent text-[var(--color-success)] border-[var(--color-success)]',
  },
  error: {
    solid:   'bg-[var(--color-error)] text-white border-[var(--color-error)]',
    soft:    'bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)]',
    outline: 'bg-transparent text-[var(--color-error)] border-[var(--color-error)]',
  },
  muted: {
    solid:   'bg-[var(--color-text-muted)] text-[var(--color-surface)] border-[var(--color-text-muted)]',
    soft:    'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]',
    outline: 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)]',
  },
  surface: {
    solid:   'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)]',
    soft:    'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    outline: 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)]',
  },
};

const sizeMap: Record<Size, string> = {
  sm: 'text-[length:var(--text-xs)] px-2 py-0.5 gap-1',
  md: 'text-[length:var(--text-sm)] px-2.5 py-1 gap-1.5',
};

const iconSizeMap: Record<Size, number> = { sm: 12, md: 14 };

export function Badge({
  variant = 'soft',
  color = 'primary',
  size = 'sm',
  icon: Icon,
  dot = false,
  children,
  class: className = '',
}: BadgeProps) {
  if (dot) {
    return (
      <span class={`inline-block w-2 h-2 rounded-full flex-shrink-0 bg-[var(--color-primary)] ${className}`} />
    );
  }

  return (
    <span class={`inline-flex items-center rounded-full border font-medium ${colorMap[color][variant]} ${sizeMap[size]} ${className}`}>
      {Icon && <Icon size={iconSizeMap[size]} />}
      {children}
    </span>
  );
}
