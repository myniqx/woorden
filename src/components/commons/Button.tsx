import type { ComponentChildren } from 'preact';
import type { LucideIcon } from 'lucide-preact';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Color = 'default' | 'primary' | 'success' | 'danger' | 'muted';
type Size = 'sm' | 'md' | 'icon';

interface ButtonProps {
  variant?: Variant;
  color?: Color;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
  class?: string;
  children?: ComponentChildren;
}

const base = 'inline-flex items-center justify-center gap-1 border font-medium cursor-pointer transition-all duration-[var(--transition-fast)] disabled:opacity-60 disabled:cursor-not-allowed';

const variantColor: Record<Variant, Record<Color, string>> = {
  solid: {
    default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
    primary: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)]',
    success: 'bg-[var(--color-success)] text-white border-[var(--color-success)] hover:brightness-110',
    danger: 'bg-[var(--color-error)] text-white border-[var(--color-error)] hover:brightness-110',
    muted: 'bg-[var(--color-text-muted)] text-[var(--color-surface)] border-[var(--color-text-muted)] hover:brightness-110',
  },
  soft: {
    default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]',
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white',
    danger: 'bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white',
    muted: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
  },
  outline: {
    default: 'bg-[var(--color-bg)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
    primary: 'bg-transparent text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
    success: 'bg-transparent text-[var(--color-success)] border-[var(--color-success)] hover:bg-[var(--color-success-light)]',
    danger: 'bg-transparent text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error-light)]',
    muted: 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]',
  },
  ghost: {
    default: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
    primary: 'bg-transparent text-[var(--color-primary)] border-transparent hover:bg-[var(--color-primary-light)]',
    success: 'bg-transparent text-[var(--color-success)] border-transparent hover:bg-[var(--color-success-light)]',
    danger: 'bg-transparent text-[var(--color-error)] border-transparent hover:bg-[var(--color-error-light)]',
    muted: 'bg-transparent text-[var(--color-text-muted)] border-transparent hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
  },
};

const sizeMap: Record<Size, string> = {
  sm: 'text-[length:var(--text-xs)] px-2 py-1 rounded-[var(--radius-sm)]',
  md: 'text-[length:var(--text-sm)] px-4 py-2 rounded-[var(--radius-md)]',
  icon: 'text-[length:var(--text-sm)] p-2 rounded-[var(--radius-sm)] aspect-square',
};

const iconSizeMap: Record<Size, number> = { sm: 14, md: 16, icon: 18 };

export function Button({
  variant = 'outline',
  color = 'default',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  title,
  'aria-label': ariaLabel,
  class: className = '',
  children,
}: ButtonProps) {
  const iconSize = iconSizeMap[size];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      class={`${base} ${variantColor[variant][color]} ${sizeMap[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
      {IconRight && <IconRight size={iconSize} />}
    </button>
  );
}
