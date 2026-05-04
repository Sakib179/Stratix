'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={cn(
        'text-left text-xs font-semibold uppercase tracking-wide text-gray-400',
        'px-4 py-3 cursor-pointer select-none hover:text-white transition-colors',
        isActive && 'text-brand-400',
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {isActive ? (
          currentOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}
