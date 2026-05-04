'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { stockAdjustmentApi, ADJUSTMENT_TYPES } from '@/lib/stockAdjustmentApi';
import { productApi } from '@/lib/productApi';
import toast from 'react-hot-toast';

interface Props { isOpen: boolean; onClose: () => void; productId?: string; }

export function StockAdjustmentForm({ isOpen, onClose, productId }: Props) {
  const qc = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState(productId || '');
  const [type, setType]       = useState(ADJUSTMENT_TYPES[0].value);
  const [quantity, setQty]    = useState(1);
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productApi.list({ limit: 500 }).then((d) => d.data),
    enabled: !productId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Select a product'); return; }
    if (quantity < 1) { toast.error('Quantity must be at least 1'); return; }
    setLoading(true);
    try {
      await stockAdjustmentApi.create({ product_id: selectedProduct, adjustment_type: type, quantity, reason: reason || undefined });
      toast.success('Stock adjusted');
      qc.invalidateQueries({ queryKey: ['stock-adjustments'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      if (selectedProduct) qc.invalidateQueries({ queryKey: ['stock-history', selectedProduct] });
      onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to adjust stock'); }
    finally { setLoading(false); }
  };

  const isRemoval = ['removal', 'damage', 'theft', 'return_out'].includes(type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Adjustment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!productId && (
          <Select label="Product" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
            <option value="">Select product…</option>
            {(products as any[]).map((p) => (
              <option key={p.id} value={p.id}>{p.product_name} (Stock: {p.stock_quantity})</option>
            ))}
          </Select>
        )}
        <Select label="Adjustment Type" value={type} onChange={(e) => setType(e.target.value)}>
          {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <div className="p-3 rounded-xl text-xs text-center font-medium border"
          style={{ borderColor: isRemoval ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)', backgroundColor: isRemoval ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)', color: isRemoval ? '#f87171' : '#4ade80' }}>
          {isRemoval ? '— Will decrease stock quantity' : '+ Will increase stock quantity'}
        </div>
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQty(parseInt(e.target.value) || 1)} required />
        <Textarea label="Reason / Notes" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Optional explanation…" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={loading}>Apply Adjustment</Button>
        </div>
      </form>
    </Modal>
  );
}
