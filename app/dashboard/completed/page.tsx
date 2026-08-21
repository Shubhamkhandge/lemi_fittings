import React from 'react';
import { getCompletedOrders } from '@/lib/actions/orders';
import { CompletedClientView } from './completed-client-view';

export default async function CompletedOrdersPage() {
  const completedOrders = await getCompletedOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Completed Orders & History</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          History of 100% paid settled orders and archived records
        </p>
      </div>

      <CompletedClientView orders={completedOrders} />
    </div>
  );
}
