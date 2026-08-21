import React from 'react';
import { getPendingOrders, getCompletedOrders, getProducts, getCustomers } from '@/lib/actions/orders';
import { SimpleDashboardClient } from './simple-dashboard-client';

export default async function DashboardPage() {
  const pendingOrders = await getPendingOrders();
  const completedOrders = await getCompletedOrders();
  const products = await getProducts();
  const customers = await getCustomers();

  const totalPendingDue = pendingOrders.reduce((sum, o) => sum + o.remainingAmount, 0);
  const totalCollected = [...pendingOrders, ...completedOrders].reduce((sum, o) => sum + o.paidAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">LEMI Interiors Sales & Payment Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Digital purchase entry, multi-product selection, regular customer auto-fill, and instant settlement
          </p>
        </div>
      </div>

      <SimpleDashboardClient
        pendingOrders={pendingOrders}
        products={products}
        customers={customers}
        totalPendingDue={totalPendingDue}
        totalCollected={totalCollected}
      />
    </div>
  );
}
