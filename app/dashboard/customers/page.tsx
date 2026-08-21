import React from 'react';
import { getCustomers, getOrders } from '@/lib/actions/orders';
import { CustomersClientView } from './customers-client-view';

export default async function CustomerDirectoryPage() {
  const customers = await getCustomers();
  const allOrders = await getOrders(false);
  const archivedOrders = await getOrders(true);
  const orders = [...allOrders, ...archivedOrders];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Regular Customer Directory</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage saved customer profiles, check purchase history, and auto-fill details on billing entries.
        </p>
      </div>

      <CustomersClientView customers={customers} orders={orders} />
    </div>
  );
}
