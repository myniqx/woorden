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
    solid:   'bg-primary text-white border-primary',
    soft:    'bg-primary-light text-primary border-primary',
    outline: 'bg-transparent text-primary border-primary',
  },
  success: {
    solid:   'bg-success text-white border-success',
    soft:    'bg-success-light text-success border-success',
    outline: 'bg-transparent text-success border-success',
  },
  error: {
    solid:   'bg-error text-white border-error',
    soft:    'bg-error-light text-error border-error',
    outline: 'bg-transparent text-error border-error',
  },
  muted: {
    solid:   'bg-text-muted text-surface border-text-muted',
    soft:    'bg-surface-elevated text-text-muted border-border',
    outline: 'bg-transparent text-text-muted border-border',
  },
  surface: {
    solid:   'bg-surface-elevated text-text-primary border-border',
    soft:    'bg-surface-elevated text-text-secondary border-border',
    outline: 'bg-transparent text-text-secondary border-border',
  },
};

const sizeMap: Record<Size, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
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
      <span class={`inline-block w-2 h-2 rounded-full flex-shrink-0 bg-primary ${className}`} />
    );
  }

  return (
    <span class={`inline-flex items-center rounded-full border font-medium ${colorMap[color][variant]} ${sizeMap[size]} ${className}`}>
      {Icon && <Icon size={iconSizeMap[size]} />}
      {children}
    </span>
  );
}
