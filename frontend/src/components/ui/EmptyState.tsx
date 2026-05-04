import React from 'react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  action?: React.ReactNode | { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return <div className="mt-6">{action}</div>;
    const a = action as { label: string; onClick: () => void };
    return (
      <Button onClick={a.onClick} className="mt-6" size="md">
        {a.label}
      </Button>
    );
  };

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return (
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-5">
          {icon}
        </div>
      );
    }
    return <div className="text-5xl mb-5 animate-float">{icon}</div>;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      {renderIcon()}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm leading-relaxed">{description}</p>}
      {renderAction()}
    </div>
  );
}

export default EmptyState;
