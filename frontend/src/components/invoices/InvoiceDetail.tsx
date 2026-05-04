'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Mail, Copy, ChevronDown } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/Modal';
import { invoiceApi } from '@/lib/invoiceApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import toast from 'react-hot-toast';

const STATUSES = ['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'];

interface Props { invoiceId: string; }

export function InvoiceDetail({ invoiceId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceApi.get(invoiceId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => invoiceApi.updateStatus(invoiceId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Status updated');
      setShowStatusModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => invoiceApi.duplicate(invoiceId),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Duplicated as ${inv.invoice_number}`);
      router.push(`/invoices/${inv.id}`);
    },
  });

  if (isLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  if (!data) return null;

  const { items = [], status_history = [] } = data;

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await invoiceApi.downloadPDF(invoiceId, data.invoice_number); }
    catch { toast.error('Failed to download PDF'); }
    finally { setPdfLoading(false); }
  };

  const handleEmail = async () => {
    setEmailLoading(true);
    try { await invoiceApi.sendEmail(invoiceId); toast.success('Invoice sent to client'); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to send email'); }
    finally { setEmailLoading(false); }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{data.invoice_number}</h1>
              <Badge statusKey={data.status}>{data.status}</Badge>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              Issued {formatDate(data.created_at)} · Due {formatDate(data.due_date)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status change */}
            {data.status !== 'Cancelled' && data.status !== 'Paid' && (
              <Select
                value=""
                onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                className="text-sm w-40"
              >
                <option value="">Change status…</option>
                {STATUSES.filter((s) => s !== data.status).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            )}
            <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => duplicateMutation.mutate()} isLoading={duplicateMutation.isPending}>
              Duplicate
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Mail className="w-3.5 h-3.5" />} onClick={handleEmail} isLoading={emailLoading}>
              Email
            </Button>
            <Button variant="brand" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handlePDF} isLoading={pdfLoading}>
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Payments */}
            <PaymentHistory invoiceId={invoiceId} invoiceNumber={data.invoice_number} grandTotal={data.grand_total} amountPaid={data.amount_paid ?? 0} invoiceStatus={data.status} />

            {/* Bill to */}
            <Card>
              <CardHeader><CardTitle>Bill To</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold text-white">{data.client_name}</p>
                {data.client_phone && <p className="text-sm text-gray-400">{data.client_phone}</p>}
                {data.client_email && <p className="text-sm text-gray-400">{data.client_email}</p>}
                {data.client_address && <p className="text-sm text-gray-400">{data.client_address}</p>}
              </CardContent>
            </Card>

            {/* Line items */}
            <Card>
              <CardHeader><CardTitle>Items</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['#', 'Product', 'Model', 'Qty', 'Unit Price', 'Discount', 'Total'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-white">{item.product_name_snapshot}</td>
                          <td className="px-4 py-3 text-gray-400">{item.model_no_snapshot}</td>
                          <td className="px-4 py-3 text-gray-300">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-300">{formatCurrency(item.unit_price_snapshot)}</td>
                          <td className="px-4 py-3 text-gray-400">
                            {parseFloat(item.discount) > 0
                              ? item.discount_type === 'percent' ? `${item.discount}%` : formatCurrency(item.discount)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {data.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{data.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Totals */}
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Row label="Subtotal" value={formatCurrency(data.subtotal)} />
                {parseFloat(data.discount_amount) > 0 && (
                  <Row label="Discount" value={`− ${formatCurrency(data.discount_amount)}`} valueClass="text-red-400" />
                )}
                {parseFloat(data.tax_amount) > 0 && (
                  <Row label={`Tax (${data.tax_rate}%)`} value={formatCurrency(data.tax_amount)} />
                )}
                <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
                  <span className="font-bold text-white">Total Due</span>
                  <span className="text-xl font-bold text-brand-400">{formatCurrency(data.grand_total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status history */}
            {status_history.length > 0 && (
              <Card>
                <CardHeader><CardTitle>History</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {status_history.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-white">
                          {h.old_status ? `${h.old_status} → ${h.new_status}` : h.new_status}
                        </p>
                        {h.changed_by_name && <p className="text-xs text-gray-500">by {h.changed_by_name}</p>}
                        <p className="text-xs text-gray-500">{formatDate(h.changed_at)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={() => statusMutation.mutate(newStatus)}
        title={`Mark as ${newStatus}`}
        description={`Change invoice status to "${newStatus}"?`}
        confirmLabel="Confirm"
        variant={newStatus === 'Cancelled' ? 'danger' : 'default'}
        isLoading={statusMutation.isPending}
      />
    </PageTransition>
  );
}

function Row({ label, value, valueClass = 'text-gray-300' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
