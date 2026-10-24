import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'inverse' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  inverse: 'btn-inverse',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        VARIANTS[variant],
        SIZES[size],
        iconOnly && 'btn-icon',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {!iconOnly && children}
      {trailingIcon}
    </button>
  );
}
