import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  let bg = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (normalized) {
    case 'PAID':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'SENT':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'PARTIALLY_PAID':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'UNPAID':
    case 'ISSUED':
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'OVERDUE':
    case 'EXPIRED':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'REVERSED':
    case 'CANCELLED':
      bg = 'bg-slate-100 text-slate-700 border-slate-300 font-semibold line-through';
      break;
    case 'DRAFT':
      bg = 'bg-gray-100 text-gray-600 border-gray-200';
      break;
    default:
      break;
  }

  const label = normalized.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${className}`}
    >
      {label}
    </span>
  );
}
