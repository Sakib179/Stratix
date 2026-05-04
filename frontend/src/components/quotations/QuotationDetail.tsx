'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle, XCircle, Send, ArrowRight, Trash2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { quotationApi } from '@/lib/quotationApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_VARIANTS: Record<string, any> = { Draft: 'muted', Sent: 'info', Accepted: 'success', Rejected: 'danger', Converted: 'brand' };

export function QuotationDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [converting, setConverting] = useState(false);

  const { data: quot, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationApi.get(id),
  });

  if (isLoading) return <div className="space-y-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!quot) return null;

  const handleStatus = async (status: string) => {
    try {
      await quotationApi.updateStatus(id, status);
      toast.success(`Quotation marked as ${status}`);
      qc.invalidateQueries({ queryKey: ['quotation', id] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
    } catch { toast.error('Failed to update status'); }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const result = await quotationApi.convertToInvoice(id);
      toast.success(`Invoice ${result.invoice_number} created`);
      qc.invalidateQueries({ queryKey: ['quotations'] });
      router.push(`/invoices/${result.invoice_id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Conversion failed');
    } finally { setConverting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await quotationApi.remove(id);
      toast.success('Quotation deleted');
      router.push('/quotations');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Cannot delete'); }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{quot.quotation_number}</h1>
              <Badge variant={STATUS_VARIANTS[quot.status]}>{quot.status}</Badge>
            </div>
            <p className="text-gray-400 text-sm">{quot.client_name} · Created {formatDate(quot.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {quot.status === 'Draft' && (
              <>
                <Button size="sm" variant="outline" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={() => handleStatus('Sent')}>Mark Sent</Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={handleDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
              </>
            )}
            {quot.status === 'Sent' && (
              <>
                <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-500/30" leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => handleStatus('Accepted')}>Accept</Button>
                <Button size="sm" variant="outline" className="text-red-400 border-red-500/30" leftIcon={<XCircle className="w-3.5 h-3.5" />} onClick={() => handleStatus('Rejected')}>Reject</Button>
              </>
            )}
            {(quot.status === 'Accepted' || quot.status === 'Draft' || quot.status === 'Sent') && quot.status !== 'Converted' && (
              <Button size="sm" variant="brand" isLoading={converting} leftIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={handleConvert}>
                Convert to Invoice
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Client info */}
            <Card>
              <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Name', value: quot.client_name },
                  { label: 'Phone', value: quot.client_phone || '—' },
                  { label: 'Email', value: quot.client_email || '—' },
                  { label: 'Address', value: quot.client_address || '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-gray-500 text-xs mb-0.5">{f.label}</p>
                    <p className="text-white">{f.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-white/5">
                      <th className="text-left pb-3">Product</th>
                      <th className="text-right pb-3">Price</th>
                      <th className="text-right pb-3">Qty</th>
                      <th className="text-right pb-3">Disc</th>
                      <th className="text-right pb-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(quot.items ?? []).map((item) => (
                      <tr key={item.id} className="py-3">
                        <td className="py-3 text-white font-medium">{item.product_name_snapshot}<br/><span className="text-xs text-gray-500">{item.model_no_snapshot}</span></td>
                        <td className="py-3 text-right text-gray-300">{formatCurrency(item.unit_price_snapshot)}</td>
                        <td className="py-3 text-right text-gray-300">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-400">{item.discount_type === 'percent' ? `${item.discount}%` : formatCurrency(item.discount || 0)}</td>
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
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{formatCurrency(quot.subtotal)}</span></div>
                {quot.discount_amount > 0 && <div className="flex justify-between text-red-400"><span>Discount</span><span>-{formatCurrency(quot.discount_amount)}</span></div>}
                {quot.tax_amount > 0 && <div className="flex justify-between text-gray-400"><span>Tax ({quot.tax_rate}%)</span><span>{formatCurrency(quot.tax_amount)}</span></div>}
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2"><span>Grand Total</span><span>{formatCurrency(quot.grand_total)}</span></div>
              </CardContent>
            </Card>

            {quot.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent><p className="text-gray-400 text-sm">{quot.notes}</p></CardContent>
              </Card>
            )}

            {quot.converted_invoice_id && (
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <p className="text-xs text-brand-400 font-semibold mb-1">Converted</p>
                <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${quot.converted_invoice_id}`)}>
                  View Invoice
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
