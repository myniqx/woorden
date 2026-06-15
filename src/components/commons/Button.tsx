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

const base = 'inline-flex items-center justify-center gap-1 border font-medium cursor-pointer transition-all duration-(--transition-fast) disabled:opacity-60 disabled:cursor-not-allowed';

const variantColor: Record<Variant, Record<Color, string>> = {
  solid: {
    default: 'bg-surface-elevated text-text-primary border-border hover:border-primary hover:bg-primary-light',
    primary: 'bg-primary text-white border-primary hover:bg-primary-hover hover:border-primary-hover',
    success: 'bg-success text-white border-success hover:brightness-110',
    danger: 'bg-error text-white border-error hover:brightness-110',
    muted: 'bg-text-muted text-surface border-text-muted hover:brightness-110',
  },
  soft: {
    default: 'bg-surface-elevated text-text-secondary border-border hover:bg-border hover:text-text-primary',
    primary: 'bg-primary-light text-primary border-primary hover:bg-primary hover:text-white',
    success: 'bg-success-light text-success border-success hover:bg-success hover:text-white',
    danger: 'bg-error-light text-error border-error hover:bg-error hover:text-white',
    muted: 'bg-surface-elevated text-text-muted border-border hover:border-text-muted',
  },
  outline: {
    default: 'bg-bg text-text-primary border-border hover:border-primary hover:bg-primary-light',
    primary: 'bg-transparent text-primary border-primary hover:bg-primary-light',
    success: 'bg-transparent text-success border-success hover:bg-success-light',
    danger: 'bg-transparent text-error border-error hover:bg-error-light',
    muted: 'bg-transparent text-text-muted border-border hover:text-text-primary hover:border-text-muted',
  },
  ghost: {
    default: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-elevated hover:text-text-primary',
    primary: 'bg-transparent text-primary border-transparent hover:bg-primary-light',
    success: 'bg-transparent text-success border-transparent hover:bg-success-light',
    danger: 'bg-transparent text-error border-transparent hover:bg-error-light',
    muted: 'bg-transparent text-text-muted border-transparent hover:bg-surface-elevated hover:text-text-primary',
  },
};

const sizeMap: Record<Size, string> = {
  sm: 'text-xs px-2 py-1 rounded-sm',
  md: 'text-sm px-4 py-2 rounded-md',
  icon: 'text-sm p-2 rounded-sm aspect-square',
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
