'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

type Variant = 'brand' | 'outline' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  brand:   'btn-brand text-white rounded-xl shadow-brand-sm',
  outline: 'bg-transparent border border-[rgba(99,102,241,0.3)] text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/50 rounded-xl transition-all duration-200',
  ghost:   'bg-transparent text-gray-300 hover:bg-white/8 rounded-xl transition-all duration-200',
  danger:  'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl transition-all duration-200',
  success: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition-all duration-200',
};

const sizeClasses: Record<Size, string> = {
  sm:   'h-8 px-3 text-sm gap-1.5',
  md:   'h-10 px-4 text-sm gap-2',
  lg:   'h-12 px-6 text-base gap-2.5',
  icon: 'h-10 w-10 p-0 flex items-center justify-center',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'brand', size = 'md', loading, isLoading, leftIcon, rightIcon, fullWidth, className, children, disabled, ...props }, ref) => {
    const busy = loading || isLoading;
    return (
      <button
        ref={ref}
        disabled={disabled || busy}
        className={cn(
          'inline-flex items-center justify-center font-semibold select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {busy ? (
          <Spinner size="sm" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
export default Button;
