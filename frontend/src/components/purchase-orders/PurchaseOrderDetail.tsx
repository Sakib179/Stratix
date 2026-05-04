'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle, XCircle, ShoppingCart, Trash2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { purchaseOrderApi } from '@/lib/purchaseOrderApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_VARIANTS: Record<string, any> = { Draft: 'muted', Ordered: 'info', Received: 'success', Cancelled: 'danger' };

export function PurchaseOrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [statusLoading, setStatusLoading] = useState(false);

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.get(id),
  });

  if (isLoading) return <div className="space-y-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!po) return null;

  const updateStatus = async (status: string) => {
    setStatusLoading(true);
    try {
      await purchaseOrderApi.updateStatus(id, status, status === 'Received' ? new Date().toISOString().split('T')[0] : undefined);
      toast.success(`PO marked as ${status}${status === 'Received' ? ' — stock updated' : ''}`);
      qc.invalidateQueries({ queryKey: ['purchase-order', id] });
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setStatusLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this purchase order?')) return;
    try {
      await purchaseOrderApi.remove(id);
      toast.success('Deleted');
      router.push('/purchase-orders');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Cannot delete'); }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{po.po_number}</h1>
              <Badge variant={STATUS_VARIANTS[po.status]}>{po.status}</Badge>
            </div>
            <p className="text-gray-400 text-sm">{po.supplier_name || 'No supplier'} · {formatDate(po.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {po.status === 'Draft' && (
              <>
                <Button size="sm" variant="outline" leftIcon={<ShoppingCart className="w-3.5 h-3.5" />} isLoading={statusLoading} onClick={() => updateStatus('Ordered')}>Mark Ordered</Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              </>
            )}
            {po.status === 'Ordered' && (
              <>
                <Button size="sm" variant="brand" isLoading={statusLoading} leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => updateStatus('Received')}>Mark Received</Button>
                <Button size="sm" variant="ghost" className="text-red-400" isLoading={statusLoading} leftIcon={<XCircle className="w-3.5 h-3.5" />} onClick={() => updateStatus('Cancelled')}>Cancel</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-white/5">
                      <th className="text-left pb-3">Product</th>
                      <th className="text-right pb-3">Ordered</th>
                      <th className="text-right pb-3">Received</th>
                      <th className="text-right pb-3">Unit Cost</th>
                      <th className="text-right pb-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(po.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 text-white">{item.product_name}<br/><span className="text-xs text-gray-500">{item.model_no}</span></td>
                        <td className="py-3 text-right text-gray-300">{item.quantity_ordered}</td>
                        <td className="py-3 text-right">
                          <span className={`${item.quantity_received === item.quantity_ordered ? 'text-green-400' : 'text-amber-400'}`}>
                            {item.quantity_received ?? 0}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-300">{formatCurrency(item.unit_cost)}</td>
                        <td className="py-3 text-right font-semibold text-white">{formatCurrency(item.line_total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Supplier', value: po.supplier_name || '—' },
                  { label: 'Phone', value: po.supplier_phone || '—' },
                  { label: 'Expected', value: po.expected_date ? formatDate(po.expected_date) : '—' },
                  { label: 'Received', value: po.received_date ? formatDate(po.received_date) : '—' },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="text-white">{f.value}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="text-white font-bold text-base">{formatCurrency(po.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
            {po.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent><p className="text-gray-400 text-sm">{po.notes}</p></CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
