'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const getStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 16 && score >= 5) score++;

  const levels = [
    { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-400' },
    { label: 'Weak',      color: 'bg-orange-500', textColor: 'text-orange-400' },
    { label: 'Fair',      color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'Good',      color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    { label: 'Strong',    color: 'bg-lime-500', textColor: 'text-lime-400' },
    { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: 'Excellent!', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
  ];

  const clampedScore = Math.max(0, Math.min(score, 6));
  return { score: clampedScore, ...levels[Math.max(0, clampedScore - 1)] || levels[0] };
};

const requirements = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

export default function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1 rounded-full transition-all duration-300',
              i < strength.score ? strength.color : 'bg-surface-600'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', strength.textColor)}>{strength.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5">
            <span className={cn('text-xs', req.test(password) ? 'text-emerald-400' : 'text-surface-300')}>
              {req.test(password) ? '✓' : '○'}
            </span>
            <span className={cn('text-xs', req.test(password) ? 'text-emerald-400' : 'text-surface-300')}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
