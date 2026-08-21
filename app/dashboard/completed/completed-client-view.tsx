'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/calculations/financials';
import {
  Trash2,
  Phone,
  RotateCcw,
  Search,
  X,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { deleteOrder, unarchiveOrder, deleteOrdersByDateRange } from '@/lib/actions/orders';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CompletedClientView({ orders = [] }: { orders?: any[] }) {
  const router = useRouter();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal States
  const [recoverModalOrder, setRecoverModalOrder] = useState<any | null>(null);
  const [dueInputAmount, setDueInputAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  // Filtered orders by Search & Date Range
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => {
      if (!o) return false;
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch =
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.customerMobile && o.customerMobile.includes(term)) ||
        (o.productName && o.productName.toLowerCase().includes(term)) ||
        (o.items && o.items.some((i: any) => i?.productName && i.productName.toLowerCase().includes(term)));

      if (!matchesSearch) return false;

      // Date Range Filter
      if (o.createdAt) {
        const orderDate = new Date(o.createdAt);
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      return true;
    });
  }, [safeOrders, searchTerm, fromDate, toDate]);

  // Open Recover Modal
  const handleOpenRecoverModal = (order: any) => {
    setRecoverModalOrder(order);
    setDueInputAmount(1);
  };

  // Submit Recover with Custom Due Amount
  const handleConfirmRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverModalOrder) return;

    const due = dueInputAmount > 0 ? dueInputAmount : 1;
    setLoading(true);
    try {
      await unarchiveOrder(recoverModalOrder.id, due);
      toast.success(
        `Order ${recoverModalOrder.orderNumber} recovered to Main Billing Table with ₹${due} due balance!`
      );
      setRecoverModalOrder(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to recover order');
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete single history record
  const handleDeletePermanent = async (id: string, orderNumber: string) => {
    if (confirm(`Permanently delete history record ${orderNumber}? This action cannot be undone.`)) {
      try {
        await deleteOrder(id);
        toast.success(`History record ${orderNumber} permanently deleted`);
        router.refresh();
      } catch (err: any) {
        toast.error('Failed to delete history');
      }
    }
  };

  // Bulk Delete Range Invoices
  const handleBulkDeleteRange = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both From Date and To Date');
      return;
    }

    if (filteredOrders.length === 0) {
      toast.error('No history invoices found in selected date range');
      return;
    }

    const confirmMsg = `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE all ${filteredOrders.length} history invoices created between ${fromDate} and ${toDate}? This action CANNOT be undone!`;

    if (confirm(confirmMsg)) {
      setLoading(true);
      try {
        const res = await deleteOrdersByDateRange(fromDate, toDate);
        toast.success(`${res.count} history invoices permanently deleted!`);
        setFromDate('');
        setToDate('');
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Failed to bulk delete invoices');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* SLEEK MINIMALIST FILTER CONTROL BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search Input & Inline Date Pickers */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by order #, customer, product..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
            />
          </div>

          {/* From Date */}
          <span className="font-bold text-slate-500 text-[11px]">From:</span>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer"
            />
          </div>

          {/* To Date */}
          <span className="font-bold text-slate-500 text-[11px]">To:</span>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer"
            />
          </div>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              title="Clear date filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Record Counter & Sleek Red Delete Range Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-slate-500 font-medium text-xs">
            History: <strong className="text-slate-900 font-mono">{filteredOrders.length} Records</strong>
          </span>

          <button
            type="button"
            onClick={handleBulkDeleteRange}
            disabled={!fromDate || !toDate || filteredOrders.length === 0 || loading}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
              fromDate && toDate && filteredOrders.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : `Delete Range (${fromDate && toDate ? filteredOrders.length : 0})`}</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">ORDER #</th>
                <th className="py-3.5 px-4">CUSTOMER NAME</th>
                <th className="py-3.5 px-4">PURCHASED PRODUCTS</th>
                <th className="py-3.5 px-4 text-right">TOTAL AMOUNT</th>
                <th className="py-3.5 px-4 text-right">PAID AMOUNT</th>
                <th className="py-3.5 px-4 text-center w-64">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic text-sm">
                    No completed order history records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const hasMultiItems = o.items && o.items.length > 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-blue-900 text-sm">{o.orderNumber}</td>

                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900 block text-sm">{o.customerName}</span>
                        {o.customerMobile && (
                          <span className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{o.customerMobile}</span>
                          </span>
                        )}
                      </td>

                      {/* MULTI-PRODUCT DISPLAY COLUMN IN HISTORY */}
                      <td className="py-4 px-4">
                        {hasMultiItems ? (
                          <div className="space-y-1">
                            {o.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 truncate max-w-[220px]">
                                  • {item.productName}
                                </span>
                                <span className="ml-2 font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.quantity} Pcs
                                </span>
                              </div>
                            ))}
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-0.5">
                              Total: {o.quantity} Pcs ({o.items.length} Products) | Date: {new Date(o.createdAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{o.productName}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              Qty: <strong>{o.quantity} Pcs</strong> | Date: {new Date(o.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold font-mono text-slate-900 text-sm">
                        {formatCurrency(o.totalAmount)}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold font-mono text-emerald-700 text-sm">
                        {formatCurrency(o.paidAmount)}
                      </td>

                      {/* BLUE RECOVER TO BILLING BUTTON & DELETE ICON ONLY */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2.5">
                          {/* 🔵 BLUE RECOVER TO BILLING BUTTON (OPENS DUE AMOUNT POPUP) */}
                          <button
                            type="button"
                            onClick={() => handleOpenRecoverModal(o)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                            title="Re-open order to active billing table"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Recover to Billing</span>
                          </button>

                          {/* 🗑️ DELETE ICON ONLY */}
                          <button
                            type="button"
                            onClick={() => handleDeletePermanent(o.id, o.orderNumber)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete history permanently"
                          >
                            <Trash2 className="w-5 h-5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔄 RECOVER ORDER CUSTOM DUE AMOUNT POPUP MODAL */}
      {recoverModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Recover Order to Billing Table</h3>
                  <p className="text-xs text-blue-400 font-mono">{recoverModalOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecoverModalOrder(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRecover} className="p-6 space-y-4 text-xs">
              {/* Order Info Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Customer Name:</span>
                  <strong className="text-slate-900">{recoverModalOrder.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Total Invoice Amount:</span>
                  <strong className="text-blue-900 font-mono">{formatCurrency(recoverModalOrder.totalAmount)}</strong>
                </div>
              </div>

              {/* Custom Due Amount Input Field */}
              <div>
                <label className="block font-extrabold text-slate-900 uppercase tracking-wide mb-1 text-[11px]">
                  ENTER INVOICE DUE AMOUNT (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={recoverModalOrder.totalAmount}
                  value={dueInputAmount}
                  onChange={(e) => setDueInputAmount(parseFloat(e.target.value) || 1)}
                  placeholder="1"
                  className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-base font-extrabold font-mono text-amber-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter the due balance amount with which this order will appear on the main billing statement.
                </p>
              </div>

              {/* Live Summary Calculation */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-blue-950 font-bold">
                  <span>Adjusted Paid Amount:</span>
                  <span>{formatCurrency(Math.max(0, recoverModalOrder.totalAmount - dueInputAmount))}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-extrabold pt-1 border-t border-blue-200">
                  <span>New Due Balance on Table:</span>
                  <span>{formatCurrency(dueInputAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecoverModalOrder(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{loading ? 'Recovering...' : 'Confirm & Recover to Billing'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
