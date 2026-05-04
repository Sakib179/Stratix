/**
 * Shared invoice calculation logic (mirrors frontend invoiceCalculations.ts)
 * Calculation order: subtotal → item discounts → invoice discount → tax → grand total
 */

const calcLineTotal = ({ unit_price, quantity, discount_type, discount }) => {
  const unitDiscount = discount_type === 'percent'
    ? (parseFloat(unit_price) * parseFloat(discount || 0)) / 100
    : parseFloat(discount || 0);
  return Math.max(0, (parseFloat(unit_price) - unitDiscount) * parseInt(quantity));
};

const calcInvoiceTotals = ({ items, discount_type, discount_value, tax_rate }) => {
  const subtotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);

  const discountValue = parseFloat(discount_value || 0);
  const taxRate = parseFloat(tax_rate || 0);

  const discount_amount = discount_type === 'percent'
    ? (subtotal * discountValue) / 100
    : discountValue;

  const afterDiscount = Math.max(0, subtotal - discount_amount);
  const tax_amount = (afterDiscount * taxRate) / 100;
  const grand_total = afterDiscount + tax_amount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discount_amount.toFixed(2)),
    tax_amount: parseFloat(tax_amount.toFixed(2)),
    grand_total: parseFloat(grand_total.toFixed(2)),
  };
};

module.exports = { calcLineTotal, calcInvoiceTotals };
