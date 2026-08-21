export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatINR(amount: number): string {
  return formatCurrency(amount);
}

export interface ItemCalculationInput {
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  discountType?: 'PERCENT' | 'AMOUNT';
  gstPercentage: number;
}

export interface ItemCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export function calculateLineItem(item: ItemCalculationInput): ItemCalculationResult {
  const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
  let discountAmount = 0;

  if (item.discountType === 'PERCENT') {
    discountAmount = (subtotal * (item.discount || 0)) / 100;
  } else {
    discountAmount = item.discount || 0;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = (taxableAmount * (item.gstPercentage || 0)) / 100;
  const totalAmount = taxableAmount + gstAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

export interface InvoiceTotalsInput {
  items: ItemCalculationInput[];
  overallDiscount?: number;
}

export interface InvoiceTotalsResult {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export function calculateInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotalsResult {
  let subtotal = 0;
  let lineDiscountTotal = 0;
  let taxableTotal = 0;
  let gstTotal = 0;

  for (const item of input.items) {
    const calc = calculateLineItem(item);
    subtotal += calc.subtotal;
    lineDiscountTotal += calc.discountAmount;
    taxableTotal += calc.taxableAmount;
    gstTotal += calc.gstAmount;
  }

  const overallDiscount = input.overallDiscount || 0;
  const finalDiscount = lineDiscountTotal + overallDiscount;
  const finalTaxable = Math.max(0, subtotal - finalDiscount);
  const grandTotal = finalTaxable + gstTotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(finalDiscount * 100) / 100,
    taxableAmount: Math.round(finalTaxable * 100) / 100,
    gstAmount: Math.round(gstTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

export function deriveInvoiceStatus(
  grandTotal: number,
  paidAmount: number,
  dueDate?: Date | string | null,
  isCancelled?: boolean
): 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
  if (isCancelled) return 'CANCELLED';
  if (paidAmount >= grandTotal && grandTotal > 0) return 'PAID';
  if (paidAmount > 0 && paidAmount < grandTotal) return 'PARTIALLY_PAID';

  if (dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return 'OVERDUE';
  }

  return 'ISSUED';
}
