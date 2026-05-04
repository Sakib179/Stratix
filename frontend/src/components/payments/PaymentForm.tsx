'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { paymentApi } from '@/lib/paymentApi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  remaining: number;
  isOpen: boolean;
  onClose: () => void;
}

const METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Mobile Banking', 'Other'];

export function PaymentForm({ invoiceId, invoiceNumber, remaining, isOpen, onClose }: Props) {
  const qc = useQueryClient();
  const [amount, setAmount]     = useState(String(remaining.toFixed(2)));
  const [method, setMethod]     = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes]       = useState('');
  const [paidAt, setPaidAt]     = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > remaining + 0.01) { toast.error(`Exceeds remaining balance (${formatCurrency(remaining)})`); return; }

    setLoading(true);
    try {
      await paymentApi.create(invoiceId, {
        amount: amt, payment_method: method,
        reference_number: reference || undefined,
        notes: notes || undefined,
        paid_at: paidAt,
      });
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      qc.invalidateQueries({ queryKey: ['payments', invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment — ${invoiceNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
          <span className="text-sm text-gray-400">Remaining Balance</span>
          <span className="text-white font-bold">{formatCurrency(remaining)}</span>
        </div>

        <Input
          label="Amount Paid"
          type="number" min={0.01} step={0.01} max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftIcon={<DollarSign size={15} />}
          required
        />

        <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>

        <Input
          label="Reference Number"
          placeholder="Cheque no., transaction ID, etc."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <Input
          label="Payment Date"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />

        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={loading}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
}
