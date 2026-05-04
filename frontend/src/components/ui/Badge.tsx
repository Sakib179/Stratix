import { HTMLAttributes } from 'react';
import { cn, statusColors } from '@/lib/utils';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'auto';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  statusKey?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  brand:   'bg-brand-500/15 text-brand-400 border border-brand-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/30',
  info:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  muted:   'bg-surface-600 text-surface-100 border border-surface-500',
  auto:    '',
};

const dotColors: Record<BadgeVariant, string> = {
  brand:   'bg-brand-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  muted:   'bg-surface-200',
  auto:    '',
};

export function Badge({ variant = 'brand', statusKey, dot, className, children, ...props }: BadgeProps) {
  const cls = statusKey ? (statusColors[statusKey] || variantMap.muted) : variantMap[variant];
  const dotColor = variant !== 'auto' ? dotColors[variant] : 'bg-surface-200';

  return (
    <span
      className={cn('badge', cls, className)}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', dotColor)} />}
      {children}
    </span>
  );
}

export default Badge;
