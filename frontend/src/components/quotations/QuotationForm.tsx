'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';
import { quotationApi, type QuotationItem } from '@/lib/quotationApi';
import { productApi } from '@/lib/productApi';
import { formatCurrency } from '@/lib/utils';
import { calcInvoiceTotals } from '@/lib/invoiceCalculations';
import toast from 'react-hot-toast';

interface LineItem extends QuotationItem {
  _key: number;
}

let _key = 0;
const newItem = (): LineItem => ({
  _key: ++_key,
  product_id: undefined,
  product_name_snapshot: '',
  model_no_snapshot: '',
  unit_price_snapshot: 0,
  quantity: 1,
  discount_type: 'flat',
  discount: 0,
  line_total: 0,
});

export function QuotationForm() {
  const router = useRouter();
  const [clientId, setClientId]   = useState('');
  const [items, setItems]         = useState<LineItem[]>([newItem()]);
  const [discountType, setDType]  = useState<'flat'|'percent'>('flat');
  const [discountValue, setDVal]  = useState(0);
  const [taxRate, setTaxRate]     = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);

  const { data: products = [] } = useQuery({ queryKey: ['products-all'], queryFn: () => productApi.list({ limit: 200 }).then((d) => d.data) });

  const totals = calcInvoiceTotals(
    items.map((it) => ({ unit_price: it.unit_price_snapshot, quantity: it.quantity, discount_type: it.discount_type || 'flat', discount: it.discount || 0 })),
    discountType, discountValue, taxRate
  );

  const updateItem = (key: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, ...patch } : it));
  };

  const pickProduct = (key: number, productId: string) => {
    const p = products.find((p: any) => p.id === productId);
    if (!p) return;
    updateItem(key, { product_id: p.id, product_name_snapshot: p.product_name, model_no_snapshot: p.model_no, unit_price_snapshot: p.unit_price });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { toast.error('Select a client'); return; }
    if (items.some((it) => !it.product_name_snapshot || it.unit_price_snapshot <= 0)) {
      toast.error('Fill all line items'); return;
    }
    setLoading(true);
    try {
      const quot = await quotationApi.create({
        client_id: clientId,
        items: items.map(({ _key, ...rest }) => rest),
        discount_type: discountType,
        discount_value: discountValue,
        tax_rate: taxRate,
        valid_until: validUntil || undefined,
        notes: notes || undefined,
      });
      toast.success('Quotation created');
      router.push(`/quotations/${quot.id}`);
    } catch {
      toast.error('Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">New Quotation</h1>
            <p className="text-gray-400 text-sm mt-0.5">Create a quote to send to your client</p>
          </div>
          <Button type="submit" variant="brand" isLoading={loading} leftIcon={<Save className="w-4 h-4" />}>
            Save Quotation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Client */}
            <Card>
              <CardHeader><CardTitle>Client</CardTitle></CardHeader>
              <CardContent>
                <ClientSearchInput value={clientId} onChange={setClientId} />
              </CardContent>
            </Card>

            {/* Line items */}
            <Card>
              <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => {
                  const base = item.unit_price_snapshot * item.quantity;
                  const disc = item.discount_type === 'percent' ? base * (item.discount || 0) / 100 : (item.discount || 0);
                  const lineTotal = Math.max(0, base - disc);
                  return (
                    <div key={item._key} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-white/5">
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50"
                          value={item.product_id || ''}
                          onChange={(e) => pickProduct(item._key, e.target.value)}
                        >
                          <option value="">Select product…</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                        </select>
                        {!item.product_id && (
                          <Input className="mt-1.5" placeholder="Or type name" value={item.product_name_snapshot}
                            onChange={(e) => updateItem(item._key, { product_name_snapshot: e.target.value })} />
                        )}
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input type="number" min={0.01} step={0.01} placeholder="Price" value={item.unit_price_snapshot || ''}
                          onChange={(e) => updateItem(item._key, { unit_price_snapshot: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <Input type="number" min={1} placeholder="Qty" value={item.quantity}
                          onChange={(e) => updateItem(item._key, { quantity: parseInt(e.target.value) || 1 })} />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <Input type="number" min={0} placeholder="Disc" value={item.discount || ''}
                          onChange={(e) => updateItem(item._key, { discount: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-10 sm:col-span-1">
                        <select className="w-full px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                          value={item.discount_type} onChange={(e) => updateItem(item._key, { discount_type: e.target.value as 'flat'|'percent' })}>
                          <option value="flat">৳</option>
                          <option value="percent">%</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between">
                        <span className="text-xs text-brand-300 font-medium">{formatCurrency(lineTotal)}</span>
                        {items.length > 1 && (
                          <button type="button" onClick={() => setItems((p) => p.filter((i) => i._key !== item._key))}
                            className="text-red-400/60 hover:text-red-400 ml-1">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button type="button" variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => setItems((p) => [...p, newItem()])}>
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input label="Valid Until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={discountType} onChange={(e) => setDType(e.target.value as any)} className="w-24">
                    <option value="flat">Flat</option>
                    <option value="percent">%</option>
                  </Select>
                  <Input type="number" min={0} placeholder="Discount" value={discountValue || ''} onChange={(e) => setDVal(parseFloat(e.target.value) || 0)} />
                </div>
                <Input label="Tax Rate (%)" type="number" min={0} max={100} value={taxRate || ''} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                  {totals.discountAmount > 0 && <div className="flex justify-between text-red-400"><span>Discount</span><span>-{formatCurrency(totals.discountAmount)}</span></div>}
                  {totals.taxAmount > 0 && <div className="flex justify-between text-gray-400"><span>Tax</span><span>{formatCurrency(totals.taxAmount)}</span></div>}
                  <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2"><span>Total</span><span>{formatCurrency(totals.grandTotal)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageTransition>
  );
}
