export interface LineItemInput {
  unit_price: number;
  quantity: number;
  discount_type: 'flat' | 'percent';
  discount: number;
}

export interface InvoiceTotalsInput {
  items: LineItemInput[];
  discount_type: 'flat' | 'percent';
  discount_value: number;
  tax_rate: number;
}

export const calcLineTotal = ({ unit_price, quantity, discount_type, discount }: LineItemInput): number => {
  const unitDiscount =
    discount_type === 'percent'
      ? (unit_price * (discount || 0)) / 100
      : discount || 0;
  return Math.max(0, (unit_price - unitDiscount) * quantity);
};

export const calcInvoiceTotals = ({ items, discount_type, discount_value, tax_rate }: InvoiceTotalsInput) => {
  const subtotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);

  const discountAmt =
    discount_type === 'percent'
      ? (subtotal * (discount_value || 0)) / 100
      : discount_value || 0;

  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = (afterDiscount * (tax_rate || 0)) / 100;
  const grandTotal = afterDiscount + taxAmt;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discountAmt.toFixed(2)),
    tax_amount: parseFloat(taxAmt.toFixed(2)),
    grand_total: parseFloat(grandTotal.toFixed(2)),
  };
};
