'use client';

import { Select } from '@/components/ui/Select';
import { FilterChip } from '@/components/ui/FilterChip';
import { Button } from '@/components/ui/Button';
import type { ProductCategory } from '@/types';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Filters {
  category_id: string;
  stock: string;
  sort: string;
  order: 'asc' | 'desc';
  min_price: string;
  max_price: string;
}

interface ProductFiltersProps {
  filters: Filters;
  categories: ProductCategory[];
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, categories, onChange, onReset }: ProductFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.category_id,
    filters.stock,
    filters.min_price,
    filters.max_price,
  ].filter(Boolean).length;

  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.category_id) {
    const cat = categories.find((c) => c.id === filters.category_id);
    chips.push({ label: cat?.name ?? 'Category', onRemove: () => onChange({ category_id: '' }) });
  }
  if (filters.stock) {
    const labels: Record<string, string> = { in: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };
    chips.push({ label: labels[filters.stock] ?? filters.stock, onRemove: () => onChange({ stock: '' }) });
  }
  if (filters.min_price) chips.push({ label: `Min ৳${filters.min_price}`, onRemove: () => onChange({ min_price: '' }) });
  if (filters.max_price) chips.push({ label: `Max ৳${filters.max_price}`, onRemove: () => onChange({ max_price: '' }) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          onClick={() => setOpen((p) => !p)}
          className={cn(activeCount > 0 && 'border-brand-500/50 text-brand-300')}
        >
          Filters {activeCount > 0 && `(${activeCount})`}
        </Button>

        {chips.map((chip) => (
          <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
        ))}

        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline">
            Clear all
          </button>
        )}
      </div>

      {open && (
        <div className="glass rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border border-white/5">
          <Select
            label="Category"
            value={filters.category_id}
            onChange={(e) => onChange({ category_id: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Stock Status"
            value={filters.stock}
            onChange={(e) => onChange({ stock: e.target.value })}
          >
            <option value="">All</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Min Price (৳)</label>
            <input
              type="number"
              min={0}
              value={filters.min_price}
              onChange={(e) => onChange({ min_price: e.target.value })}
              placeholder="0"
              className="input-base w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Price (৳)</label>
            <input
              type="number"
              min={0}
              value={filters.max_price}
              onChange={(e) => onChange({ max_price: e.target.value })}
              placeholder="∞"
              className="input-base w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
