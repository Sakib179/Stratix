'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { paymentApi } from '@/lib/paymentApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { PaymentForm } from './PaymentForm';
import toast from 'react-hot-toast';

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  grandTotal: number;
  amountPaid: number;
  invoiceStatus: string;
}

export function PaymentHistory({ invoiceId, invoiceNumber, grandTotal, amountPaid, invoiceStatus }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: () => paymentApi.listByInvoice(invoiceId),
  });

  const remaining = Math.max(0, grandTotal - amountPaid);
  const canPay = invoiceStatus !== 'Paid' && invoiceStatus !== 'Cancelled' && remaining > 0;

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await paymentApi.remove(invoiceId, paymentId);
      toast.success('Payment deleted');
      qc.invalidateQueries({ queryKey: ['payments', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              Payments
            </span>
            {canPay && (
              <Button size="sm" variant="brand" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)}>
                Record Payment
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-sm font-bold text-white">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
              <p className="text-xs text-gray-500 mb-1">Paid</p>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(amountPaid)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10">
              <p className="text-xs text-gray-500 mb-1">Remaining</p>
              <p className="text-sm font-bold text-amber-400">{formatCurrency(remaining)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (amountPaid / grandTotal) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.paid_at)} · {p.payment_method}</p>
                      {p.reference_number && <p className="text-xs text-gray-600">Ref: {p.reference_number}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-xs">Paid</Badge>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentForm
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        remaining={remaining}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </>
  );
}
