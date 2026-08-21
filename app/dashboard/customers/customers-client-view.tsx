'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/calculations/financials';
import { UserPlus, Search, Phone, MapPin, Eye, Trash2, X, ShoppingBag } from 'lucide-react';
import { createCustomer, deleteCustomer } from '@/lib/actions/orders';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CustomersClientView({ customers, orders }: { customers: any[]; orders: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter Customers by Search
  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(query) || (c.mobile && c.mobile.includes(query));
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createCustomer({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });

      toast.success(`Regular customer ${name} saved successfully!`);
      setShowAddModal(false);
      setName('');
      setMobile('');
      setAddress('');
      setNotes('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (confirm(`Delete regular customer ${customerName} from directory?`)) {
      try {
        await deleteCustomer(id);
        toast.success(`Customer ${customerName} deleted`);
        router.refresh();
      } catch (err: any) {
        toast.error('Failed to delete customer');
      }
    }
  };

  // Get Order Stats for a customer
  const getCustomerStats = (customer: any) => {
    const custOrders = orders.filter((o) => {
      const matchName = o.customerName?.toLowerCase().trim() === customer.name?.toLowerCase().trim();
      const matchMobile = customer.mobile && o.customerMobile && o.customerMobile.trim() === customer.mobile.trim();
      return matchName || matchMobile;
    });

    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDue = custOrders.reduce((sum, o) => sum + o.remainingAmount, 0);

    return {
      orderCount: custOrders.length,
      totalSpent,
      totalDue,
      custOrders,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved regular customers by name or mobile..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Regular Customer</span>
        </button>
      </div>

      {/* Customers Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile Contact</th>
                <th className="py-3.5 px-4">Location / Address</th>
                <th className="py-3.5 px-4 text-center">Total Orders</th>
                <th className="py-3.5 px-4 text-right">Total Business</th>
                <th className="py-3.5 px-4 text-right">Current Due</th>
                <th className="py-3.5 px-4 text-center">Profile / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic text-sm">
                    No regular customers saved yet. Click "Add Regular Customer" to add one!
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer);

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                        {customer.name}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-700">
                        {customer.mobile ? (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customer.mobile}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">No contact</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {customer.address ? (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold rounded-full text-[11px] font-mono">
                          {stats.orderCount} Orders
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(stats.totalSpent)}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-amber-600 text-sm">
                        {formatCurrency(stats.totalDue)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setSelectedCustomer({ ...customer, stats })}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors border border-blue-200"
                            title="View Full Profile & Purchase History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>

                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ADD NEW CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold">Add Regular Customer</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Architect & Co"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9820012345"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Shop / Location Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 12, Andheri West, Mumbai"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Regular interior contractor..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedCustomer.name}</h3>
                  <p className="text-xs text-blue-400 font-mono">
                    {selectedCustomer.mobile || 'No contact'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Orders</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedCustomer.stats.orderCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Business</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(selectedCustomer.stats.totalSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Current Due</span>
                  <span className="text-base font-extrabold text-amber-600">
                    {formatCurrency(selectedCustomer.stats.totalDue)}
                  </span>
                </div>
              </div>

              {/* Order History Table */}
              <div>
                <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[11px] tracking-wider flex items-center space-x-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Purchase History ({selectedCustomer.stats.custOrders.length})</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Products</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomer.stats.custOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            No billing orders found for this customer.
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.stats.custOrders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{o.orderNumber}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{o.productName}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                              {formatCurrency(o.totalAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                              {formatCurrency(o.paidAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                              {formatCurrency(o.remainingAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
