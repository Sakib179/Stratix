'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { expenseApi, type Expense, type ExpenseCategory } from '@/lib/expenseApi';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
}

const METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Mobile Banking', 'Other'];

export function ExpenseForm({ isOpen, onClose, expense, categories }: Props) {
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle]           = useState('');
  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState('Cash');
  const [reference, setReference]   = useState('');
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (expense) {
      setCategoryId(expense.category_id || '');
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setMethod(expense.payment_method);
      setReference(expense.reference_number || '');
      setDate(expense.expense_date.split('T')[0]);
      setNotes(expense.notes || '');
    } else {
      setCategoryId(''); setTitle(''); setAmount(''); setMethod('Cash');
      setReference(''); setDate(new Date().toISOString().split('T')[0]); setNotes('');
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) { toast.error('Title and amount are required'); return; }
    setLoading(true);
    try {
      const payload = { category_id: categoryId || undefined, title, amount: parseFloat(amount), payment_method: method, reference_number: reference || undefined, expense_date: date, notes: notes || undefined };
      if (expense) {
        await expenseApi.update(expense.id, payload);
        toast.success('Expense updated');
      } else {
        await expenseApi.create(payload);
        toast.success('Expense recorded');
      }
      qc.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    } catch { toast.error('Failed to save expense'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Uncategorised</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was this for?" required />
        <Input label="Amount" type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice no., receipt no., etc." />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={loading}>{expense ? 'Update' : 'Save'} Expense</Button>
        </div>
      </form>
    </Modal>
  );
}
