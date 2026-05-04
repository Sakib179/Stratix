'use client';

import { useQuery } from '@tanstack/react-query';
import { Trash2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { productApi } from '@/lib/productApi';
import { calcLineTotal } from '@/lib/invoiceCalculations';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useRef, useEffect } from 'react';
import type { Product } from '@/types';

export interface LineItem {
  id: string;
  product_id: string;
  product_name: string;
  model_no: string;
  unit_price: number;
  quantity: number;
  discount_type: 'flat' | 'percent';
  discount: number;
}

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

function ProductDropdown({ onSelect }: { onSelect: (p: Product) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebounce(query, 300);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['products-search', debouncedQ],
    queryFn: () => productApi.list({ search: debouncedQ, limit: 10 }),
    enabled: debouncedQ.length > 0,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const products = data?.data ?? [];

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search product…"
          className="input-base w-full pl-8 text-sm"
        />
      </div>
      {open && query && (
        <div className="absolute left-0 right-0 mt-1 glass border border-white/10 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {products.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No products found</p>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => { onSelect(p); setQuery(''); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-white">{p.product_name}</p>
                  <p className="text-xs text-gray-400">{p.model_no}</p>
                </div>
                <span className="text-sm text-brand-300 font-medium">{formatCurrency(p.unit_price)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function InvoiceLineItemsTable({ items, onChange }: Props) {
  const addProduct = (p: Product) => {
    const existing = items.find((i) => i.product_id === p.id);
    if (existing) {
      onChange(items.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      onChange([...items, {
        id: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.product_name,
        model_no: p.model_no,
        unit_price: p.unit_price,
        quantity: 1,
        discount_type: 'flat',
        discount: 0,
      }]);
    }
  };

  const update = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((i) => i.id === id ? { ...i, ...patch } : i));
  };

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  return (
    <div className="space-y-3">
      <ProductDropdown onSelect={addProduct} />

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/3 border-b border-white/5">
                {['Product', 'Unit Price', 'Qty', 'Discount', 'Line Total', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const lineTotal = calcLineTotal({ unit_price: item.unit_price, quantity: item.quantity, discount_type: item.discount_type, discount: item.discount });
                return (
                  <tr key={item.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2">
                      <p className="font-medium text-white">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.model_no}</p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => update(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                        className="input-base w-28 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => update(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="input-base w-16 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={item.discount_type}
                          onChange={(e) => update(item.id, { discount_type: e.target.value as 'flat' | 'percent' })}
                          className="input-base text-xs py-1 px-2 w-20"
                        >
                          <option value="flat">৳ Flat</option>
                          <option value="percent">% Off</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) => update(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          className="input-base w-20 text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-white">{formatCurrency(lineTotal)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">Search for a product above to add line items.</p>
      )}
    </div>
  );
}
