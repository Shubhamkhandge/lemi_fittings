'use client';

import React from 'react';
import { formatCurrency } from '@/lib/calculations/financials';
import { StatusBadge } from './status-badge';
import { FileText, CreditCard, RotateCcw, AlertCircle } from 'lucide-react';

export interface LedgerEntry {
  id: string;
  date: Date | string;
  type: 'INVOICE' | 'PAYMENT' | 'PAYMENT_REVERSAL';
  reference: string;
  debit: number;
  credit: number;
  runningBalance?: number;
  method?: string;
  status: string;
  notes?: string;
}

interface CustomerLedgerProps {
  entries: LedgerEntry[];
  openingBalance?: number;
}

export function CustomerLedger({ entries, openingBalance = 0 }: CustomerLedgerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Customer Account Ledger</h3>
          <p className="text-xs text-slate-500">Real-time debit, credit, and running balance audit statement</p>
        </div>
        {openingBalance > 0 && (
          <div className="text-right text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-500">Opening Balance: </span>
            <span className="font-bold text-slate-900">{formatCurrency(openingBalance)}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Reference</th>
              <th className="py-3.5 px-4 text-right">Debit (₹)</th>
              <th className="py-3.5 px-4 text-right">Credit (₹)</th>
              <th className="py-3.5 px-4 text-right font-bold">Running Balance (₹)</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                  No transaction history recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                const isReversed = entry.status === 'REVERSED';

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isReversed ? 'bg-slate-50/50 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {formattedDate}
                    </td>

                    <td className="py-3 px-4">
                      <span className="flex items-center space-x-1.5 font-medium">
                        {entry.type === 'INVOICE' && (
                          <>
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-900">Invoice</span>
                          </>
                        )}
                        {entry.type === 'PAYMENT' && (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-900">Payment</span>
                          </>
                        )}
                        {entry.type === 'PAYMENT_REVERSAL' && (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-rose-900 font-semibold">Payment Reversed</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {entry.reference}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-blue-700">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {entry.credit > 0 ? (
                        <span className={isReversed ? 'line-through text-slate-400' : ''}>
                          {formatCurrency(entry.credit)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      {formatCurrency(entry.runningBalance || 0)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {entry.method || '-'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
