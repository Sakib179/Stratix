'use client';

import { Select } from '@/components/ui/Select';
import { calcInvoiceTotals } from '@/lib/invoiceCalculations';
import { formatCurrency } from '@/lib/utils';
import type { LineItem } from './InvoiceLineItemsTable';

interface Props {
  items: LineItem[];
  discountType: 'flat' | 'percent';
  discountValue: number;
  taxRate: number;
  onDiscountTypeChange: (v: 'flat' | 'percent') => void;
  onDiscountValueChange: (v: number) => void;
  onTaxRateChange: (v: number) => void;
}

export function InvoiceTotalsPanel({
  items,
  discountType,
  discountValue,
  taxRate,
  onDiscountTypeChange,
  onDiscountValueChange,
  onTaxRateChange,
}: Props) {
  const totals = calcInvoiceTotals({
    items: items.map((i) => ({
      unit_price: i.unit_price,
      quantity: i.quantity,
      discount_type: i.discount_type,
      discount: i.discount,
    })),
    discount_type: discountType,
    discount_value: discountValue,
    tax_rate: taxRate,
  });

  return (
    <div className="bg-white/3 rounded-xl border border-white/5 p-4 space-y-3">
      {/* Invoice-level discount */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Invoice Discount</label>
          <div className="flex gap-1.5">
            <select
              value={discountType}
              onChange={(e) => onDiscountTypeChange(e.target.value as 'flat' | 'percent')}
              className="input-base text-sm py-1.5 px-2 w-24"
            >
              <option value="flat">৳ Flat</option>
              <option value="percent">% Off</option>
            </select>
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
              className="input-base flex-1 text-sm"
              placeholder="0"
            />
          </div>
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Tax Rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={taxRate}
            onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
            className="input-base w-full text-sm"
            placeholder="0"
          />
        </div>
      </div>

      {/* Totals breakdown */}
      <div className="border-t border-white/5 pt-3 space-y-1.5">
        <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
        {totals.discount_amount > 0 && (
          <Row label={`Discount (${discountType === 'percent' ? `${discountValue}%` : 'flat'})`} value={`− ${formatCurrency(totals.discount_amount)}`} valueClass="text-red-400" />
        )}
        {totals.tax_amount > 0 && (
          <Row label={`Tax (${taxRate}%)`} value={formatCurrency(totals.tax_amount)} />
        )}
        <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Grand Total</span>
          <span className="text-xl font-bold text-brand-400">{formatCurrency(totals.grand_total)}</span>
        </div>
      </div>
    </div>
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
