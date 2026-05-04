'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { purchaseOrderApi, type POItem } from '@/lib/purchaseOrderApi';
import { supplierApi } from '@/lib/supplierApi';
import { productApi } from '@/lib/productApi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LineItem extends POItem { _key: number; }
let _key = 0;
const newItem = (): LineItem => ({ _key: ++_key, product_id: '', quantity_ordered: 1, unit_cost: 0 });

export function PurchaseOrderForm() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems]           = useState<LineItem[]>([newItem()]);
  const [expectedDate, setExpDate]  = useState('');
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers-all'], queryFn: () => supplierApi.list({ limit: 200 }).then((d) => d.data) });
  const { data: products = [] }  = useQuery({ queryKey: ['products-all'],  queryFn: () => productApi.list({ limit: 200 }).then((d) => d.data) });

  const total = items.reduce((s, it) => s + it.quantity_ordered * (it.unit_cost || 0), 0);

  const updateItem = (key: number, patch: Partial<LineItem>) => setItems((p) => p.map((it) => it._key === key ? { ...it, ...patch } : it));

  const pickProduct = (key: number, productId: string) => {
    const p = products.find((p: any) => p.id === productId);
    if (!p) return;
    updateItem(key, { product_id: p.id, unit_cost: p.unit_price, product_name: p.product_name, model_no: p.model_no });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((it) => !it.product_id || it.quantity_ordered < 1 || !it.unit_cost)) {
      toast.error('Fill all line items'); return;
    }
    setLoading(true);
    try {
      const po = await purchaseOrderApi.create({
        supplier_id: supplierId || undefined,
        items: items.map(({ _key, product_name, model_no, ...rest }) => rest),
        expected_date: expectedDate || undefined,
        notes: notes || undefined,
      });
      toast.success('Purchase order created');
      router.push(`/purchase-orders/${po.id}`);
    } catch { toast.error('Failed to create purchase order'); }
    finally { setLoading(false); }
  };

  return (
    <PageTransition>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">New Purchase Order</h1>
            <p className="text-gray-400 text-sm mt-0.5">Order stock from a supplier</p>
          </div>
          <Button type="submit" variant="brand" isLoading={loading} leftIcon={<Save className="w-4 h-4" />}>Save PO</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader><CardTitle>Supplier</CardTitle></CardHeader>
              <CardContent>
                <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">No supplier (direct purchase)</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Items to Order</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item._key} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-white/5">
                    <div className="col-span-5">
                      <select
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
                        value={item.product_id} onChange={(e) => pickProduct(item._key, e.target.value)} required
                      >
                        <option value="">Select product…</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Input type="number" min={1} placeholder="Qty" value={item.quantity_ordered}
                        onChange={(e) => updateItem(item._key, { quantity_ordered: parseInt(e.target.value) || 1 })} required />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" min={0.01} step={0.01} placeholder="Unit Cost" value={item.unit_cost || ''}
                        onChange={(e) => updateItem(item._key, { unit_cost: parseFloat(e.target.value) || 0 })} required />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems((p) => p.filter((i) => i._key !== item._key))}
                          className="text-red-400/60 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => setItems((p) => [...p, newItem()])}>
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input label="Expected Delivery" type="date" value={expectedDate} onChange={(e) => setExpDate(e.target.value)} />
                <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Order Total</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-500 mt-1">{items.length} item(s)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageTransition>
  );
}
