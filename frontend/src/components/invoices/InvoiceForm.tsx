'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';
import { InvoiceLineItemsTable } from './InvoiceLineItemsTable';
import { InvoiceTotalsPanel } from './InvoiceTotalsPanel';
import { invoiceApi } from '@/lib/invoiceApi';
import type { Client } from '@/types';
import type { LineItem } from './InvoiceLineItemsTable';
import toast from 'react-hot-toast';

export function InvoiceForm() {
  const router = useRouter();
  const qc = useQueryClient();

  const [client, setClient] = useState<Client | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const [clientError, setClientError] = useState('');
  const [dateError, setDateError] = useState('');
  const [itemsError, setItemsError] = useState('');

  const mutation = useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: (invoice) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Invoice ${invoice.invoice_number} created`);
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error creating invoice'),
  });

  const validate = () => {
    let valid = true;
    if (!client) { setClientError('Please select a client'); valid = false; } else setClientError('');
    if (!dueDate) { setDateError('Due date is required'); valid = false; } else setDateError('');
    if (items.length === 0) { setItemsError('Add at least one product'); valid = false; } else setItemsError('');
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      client_id: client!.id,
      due_date: dueDate,
      notes: notes || undefined,
      discount_type: discountType,
      discount_value: discountValue,
      tax_rate: taxRate,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price_override: i.unit_price,
        discount_type: i.discount_type,
        discount: i.discount,
      })),
    });
  };

  return (
    <PageTransition>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">New Invoice</h1>
            <p className="text-gray-400 text-sm">Create a new invoice for a client</p>
          </div>
          <Button type="submit" variant="brand" isLoading={mutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
            Create Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader><CardTitle>Client & Date</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <ClientSearchInput value={client} onChange={setClient} error={clientError} />
                </div>
                <Input
                  label="Due Date"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); setDateError(''); }}
                  error={dateError}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, special instructions…" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
                {itemsError && <p className="text-xs text-red-400 mt-1">{itemsError}</p>}
              </CardHeader>
              <CardContent>
                <InvoiceLineItemsTable items={items} onChange={(v) => { setItems(v); setItemsError(''); }} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar totals */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
              <CardContent>
                <InvoiceTotalsPanel
                  items={items}
                  discountType={discountType}
                  discountValue={discountValue}
                  taxRate={taxRate}
                  onDiscountTypeChange={setDiscountType}
                  onDiscountValueChange={setDiscountValue}
                  onTaxRateChange={setTaxRate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageTransition>
  );
}
