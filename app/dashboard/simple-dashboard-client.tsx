'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  CreditCard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Phone,
  Eye,
  Edit,
  Save,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  Package,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { createOrder, addOrderPayment, archiveOrder, deleteOrder, updateOrder, OrderItemInput } from '@/lib/actions/orders';
import { formatCurrency } from '@/lib/calculations/financials';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/* =========================================================================
   SEARCHABLE CUSTOMER COMBOBOX (LIVE SEARCH REGULAR CUSTOMER)
   ========================================================================= */
function SearchableCustomerCombobox({
  customers = [],
  onSelectCustomer,
}: {
  customers: any[];
  onSelectCustomer: (cust: any) => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.mobile && c.mobile.includes(q))
    );
  }, [customers, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="🔍 Type to search saved regular customer (Name / Mobile)..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
          {filtered.length === 0 ? (
            <div className="p-3 text-slate-400 text-center italic">
              No matching regular customer found
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectCustomer(c);
                  setQuery(`${c.name} (${c.mobile || 'No Mobile'})`);
                  setIsOpen(false);
                }}
                className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-extrabold text-slate-900 block">{c.name}</span>
                  {c.mobile && (
                    <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.mobile}</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Select
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   SEARCHABLE PRODUCT COMBOBOX (LIVE SEARCH SAVED PRODUCTS)
   ========================================================================= */
function SearchableProductCombobox({
  products = [],
  value,
  onSelectProduct,
  placeholder = "Select Product",
}: {
  products: any[];
  value: string;
  onSelectProduct: (productName: string, price?: number) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative cursor-pointer">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelectProduct(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] left-0 top-full mt-1 w-full min-w-[320px] bg-white border-2 border-blue-500 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
          <div className="px-3.5 py-2 font-bold text-slate-500 uppercase text-[10px] bg-slate-50 tracking-wider flex items-center justify-between">
            <span>Select Product from List ({filtered.length})</span>
            <span className="text-blue-600 font-normal lowercase">click to select</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-slate-400 italic text-[11px] text-center">
              Custom Product (Type & enter rate/qty)
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(p.name);
                  onSelectProduct(p.name, p.price);
                  setIsOpen(false);
                }}
                className="w-full px-3.5 py-2.5 text-left hover:bg-blue-600 hover:text-white flex items-center justify-between transition-colors group"
              >
                <span className="font-bold text-slate-900 group-hover:text-white truncate max-w-[220px]">{p.name}</span>
                <span className="font-mono font-extrabold text-blue-700 group-hover:text-white text-[11px] bg-blue-50 group-hover:bg-blue-700 px-2 py-0.5 rounded border border-blue-100 group-hover:border-blue-500">
                  ₹{p.price} / {p.unit || 'Pcs'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   MAIN SIMPLE DASHBOARD CLIENT COMPONENT
   ========================================================================= */
export function SimpleDashboardClient({
  pendingOrders,
  products,
  customers = [],
  totalPendingDue,
  totalCollected,
}: {
  pendingOrders: any[];
  products: any[];
  customers?: any[];
  totalPendingDue: number;
  totalCollected: number;
}) {
  const router = useRouter();

  // Search, Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // New Order Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Multi-item table rows for New Order (starts with 1 empty row, Sr No. 1)
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([
    { productName: '', quantity: 1, unitPrice: 0 },
  ]);

  // Master Reset for New Order Form State
  const resetNewOrderForm = () => {
    setCustomerName('');
    setCustomerMobile('');
    setNotes('');
    setPaidAmount(0);
    setOrderItems([{ productName: '', quantity: 1, unitPrice: 0 }]);
  };

  // Add empty row to New Order table (appends Sr No. 2, 3, 4...)
  const handleAddEmptyRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { productName: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  // Update specific item field in New Order table
  const handleUpdateOrderItem = (
    index: number,
    field: keyof OrderItemInput,
    value: any,
    price?: number
  ) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      if (field === 'productName') {
        updated[index].productName = value;
        if (price !== undefined) {
          updated[index].unitPrice = price;
        }
      } else if (field === 'quantity') {
        updated[index].quantity = value;
      } else if (field === 'unitPrice') {
        updated[index].unitPrice = value;
      }
      return updated;
    });
  };

  // Remove line item from New Order (preserves at least 1 empty row)
  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length <= 1) {
      setOrderItems([{ productName: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Add empty row to Edit Order table
  const handleAddEditEmptyRow = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  // Update specific item field in Edit Order table
  const handleUpdateEditOrderItem = (
    index: number,
    field: keyof OrderItemInput,
    value: any,
    price?: number
  ) => {
    setEditForm((prev) => {
      const updated = [...prev.items];
      if (field === 'productName') {
        updated[index].productName = value;
        if (price !== undefined) {
          updated[index].unitPrice = price;
        }
      } else if (field === 'quantity') {
        updated[index].quantity = value;
      } else if (field === 'unitPrice') {
        updated[index].unitPrice = value;
      }
      return { ...prev, items: updated };
    });
  };

  // Remove line item from Edit Order
  const handleRemoveEditOrderItem = (index: number) => {
    if (editForm.items.length <= 1) {
      setEditForm((prev) => ({
        ...prev,
        items: [{ productName: '', quantity: 1, unitPrice: 0 }],
      }));
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Picker bar state for New Order
  const [pickerProduct, setPickerProduct] = useState('');
  const [pickerQty, setPickerQty] = useState<number>(1);
  const [pickerRate, setPickerRate] = useState<number>(0);

  // View / Edit Modal State
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerMobile: '',
    paidAmount: 0,
    notes: '',
    items: [] as OrderItemInput[],
  });

  // Picker bar state for Edit Order
  const [editPickerProduct, setEditPickerProduct] = useState('');
  const [editPickerQty, setEditPickerQty] = useState<number>(1);
  const [editPickerRate, setEditPickerRate] = useState<number>(0);

  // Record Payment Modal State
  const [payOrder, setPayOrder] = useState<any | null>(null);
  const [payInputAmount, setPayInputAmount] = useState<number>(0);

  // Handle saved customer selection
  const handleSelectSavedCustomer = (cust: any) => {
    if (cust) {
      setCustomerName(cust.name);
      setCustomerMobile(cust.mobile || '');
      toast.success(`Auto-filled customer: ${cust.name}`);
    }
  };

  // Calculate Grand Total for New Order
  const calculateNewOrderGrandTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  };

  // Add line item from picker bar to New Order table
  const handleAddPickerItem = () => {
    if (!pickerProduct.trim()) {
      toast.error('Please select or type a product name');
      return;
    }
    setOrderItems((prev) => [
      ...prev,
      {
        productName: pickerProduct.trim(),
        quantity: pickerQty || 1,
        unitPrice: pickerRate || 0,
      },
    ]);
    toast.success(`Added "${pickerProduct}" to list`);
    setPickerProduct('');
    setPickerQty(1);
    setPickerRate(0);
  };

  // Add line item from picker bar to Edit Order table
  const handleAddEditPickerItem = () => {
    if (!editPickerProduct.trim()) {
      toast.error('Please select or type a product name');
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productName: editPickerProduct.trim(),
          quantity: editPickerQty || 1,
          unitPrice: editPickerRate || 0,
        },
      ],
    }));
    toast.success(`Added "${editPickerProduct}" to edit list`);
    setEditPickerProduct('');
    setEditPickerQty(1);
    setEditPickerRate(0);
  };

  // Filtered & Searched Orders
  const filteredOrders = useMemo(() => {
    return pendingOrders.filter((order) => {
      // 1. Search Query Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesOrder = order.orderNumber?.toLowerCase().includes(query);
        const matchesCustomer = order.customerName?.toLowerCase().includes(query);
        const matchesMobile = order.customerMobile?.toLowerCase().includes(query);
        const matchesProduct = order.productName?.toLowerCase().includes(query);

        // Also search in items list
        const matchesItems = (order.items || []).some((item: any) =>
          item.productName?.toLowerCase().includes(query)
        );

        if (!matchesOrder && !matchesCustomer && !matchesMobile && !matchesProduct && !matchesItems) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'PENDING' && order.status !== 'PENDING') return false;
      if (statusFilter === 'COMPLETED' && order.status !== 'COMPLETED') return false;

      // 3. Date Filter
      if (dateFilter !== 'ALL') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();

        if (dateFilter === 'TODAY') {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === 'THIS_WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'THIS_MONTH') {
          const isThisMonth =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [pendingOrders, searchTerm, statusFilter, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Open View Modal (Read-Only Mode)
  const handleOpenView = (order: any) => {
    setViewOrder(order);
    setIsEditing(false);
  };

  // Open Edit Modal (Edit Mode)
  const handleOpenEdit = (order: any) => {
    setViewOrder(order);
    setIsEditing(true);

    // Reset edit picker
    setEditPickerProduct('');
    setEditPickerQty(1);
    setEditPickerRate(0);

    // Populate items for edit form
    const existingItems: OrderItemInput[] =
      order.items && order.items.length > 0
        ? order.items.map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
        : [
          {
            productName: order.productName || 'LEMI Item',
            quantity: order.quantity || 1,
            unitPrice: order.unitPrice || order.totalAmount,
          },
        ];

    setEditForm({
      customerName: order.customerName || '',
      customerMobile: order.customerMobile || '',
      paidAmount: order.paidAmount || 0,
      notes: order.notes || '',
      items: existingItems,
    });
  };

  // Submit New Order with Multiple Products
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    const finalItems = orderItems.filter((item) => item.productName && item.productName.trim() !== '');

    if (finalItems.length === 0) {
      toast.error('Please select or type a product name in at least one row');
      return;
    }

    setLoading(true);
    try {
      const newOrd = await createOrder({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        items: finalItems,
        paidAmount,
        notes: notes.trim(),
      });

      if (newOrd.status === 'COMPLETED') {
        toast.success(`Order ${newOrd.orderNumber} is 100% Paid! Moved straight to Order History.`);
        setShowAddModal(false);
        resetNewOrderForm();
        router.push('/dashboard/completed');
        router.refresh();
      } else {
        toast.success(`Purchase record ${newOrd.orderNumber} saved with advance payment!`);
        setShowAddModal(false);
        resetNewOrderForm();
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  // Save Edit Order
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewOrder) return;

    const finalItems = editForm.items.filter((item) => item.productName && item.productName.trim() !== '');

    if (finalItems.length === 0) {
      toast.error('Please select or type a product name in at least one row');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateOrder(viewOrder.id, {
        ...editForm,
        items: finalItems,
      });

      if (updated.status === 'COMPLETED') {
        toast.success(`Order ${viewOrder.orderNumber} is 100% Paid! Moved straight to Order History.`);
        setViewOrder(null);
        setIsEditing(false);
        router.push('/dashboard/completed');
        router.refresh();
      } else {
        toast.success(`Order ${viewOrder.orderNumber} updated successfully!`);
        setViewOrder(null);
        setIsEditing(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrder || payInputAmount <= 0) return;

    setLoading(true);
    try {
      const updated = await addOrderPayment(payOrder.id, payInputAmount);
      const remainingAfter = payOrder.remainingAmount - payInputAmount;

      if (remainingAfter <= 0 || updated.status === 'COMPLETED') {
        toast.success(`Payment verified! Order ${payOrder.orderNumber} is 100% Paid and moved straight to Order History.`);
        setPayOrder(null);
        router.push('/dashboard/completed');
        router.refresh();
      } else {
        toast.success(`Payment of ${formatCurrency(payInputAmount)} recorded. ${formatCurrency(remainingAfter)} remaining due.`);
        setPayOrder(null);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Move to History (Archive)
  const handleArchiveOrDelete = async (order: any) => {
    const isFullPay = order.status === 'COMPLETED';
    const message = isFullPay
      ? `Move completed order ${order.orderNumber} to Completed History?`
      : `Payment is NOT fully marked for ${order.orderNumber} (Remaining Due: ${formatCurrency(order.remainingAmount)}). Move to History anyway?`;

    if (confirm(message)) {
      try {
        await archiveOrder(order.id);
        toast.success(
          isFullPay
            ? `Order ${order.orderNumber} moved to Completed History!`
            : `Unpaid order ${order.orderNumber} archived to History with 'Payment Not Marked' status!`
        );
        router.refresh();
      } catch (err: any) {
        toast.error('Failed to archive order');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pending Due</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatCurrency(totalPendingDue)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Remaining to collect</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advance Collected</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Received so far</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Billing Records</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{pendingOrders.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Orders on main table</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Orders & Billing Statement</h2>
            <p className="text-xs text-slate-500">
              Create multi-product entries with live customer & product search.
            </p>
          </div>

          <button
            onClick={() => {
              resetNewOrderForm();
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Entry</span>
          </button>
        </div>

        {/* SEARCH, FILTERS & PAGINATION CONTROLS BAR */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
          {/* Left: Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order #, Customer Name, Mobile, Product..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Right Side Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-700 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Due Payment</option>
                <option value="COMPLETED">Completed / Paid</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="font-bold text-slate-700 text-[11px]">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Products & Quantity</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Paid Amount</th>
                <th className="py-3.5 px-4 text-right">Remaining Due</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic text-sm">
                    No matching billing records found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isCompleted = order.status === 'COMPLETED';
                  const percentPaid = Math.round((order.paidAmount / order.totalAmount) * 100);
                  const hasMultiItems = order.items && order.items.length > 0;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isCompleted ? 'bg-emerald-50/20' : ''
                        }`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-blue-900">
                        {order.orderNumber}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {order.customerName}
                        </span>
                        {order.customerMobile && (
                          <span className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{order.customerMobile}</span>
                          </span>
                        )}
                      </td>

                      {/* MULTI-PRODUCT DISPLAY COLUMN */}
                      <td className="py-4 px-4">
                        {hasMultiItems ? (
                          <div className="space-y-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                                  • {item.productName}
                                </span>
                                <span className="ml-2 font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.quantity} Pcs
                                </span>
                              </div>
                            ))}
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-0.5">
                              Total: {order.quantity} Pcs ({order.items.length} Products)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {order.productName}
                            </span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded text-[11px]">
                              Qty: {order.quantity} Pcs
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-emerald-600 text-sm block">
                          {formatCurrency(order.paidAmount)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          ({percentPaid}% Paid)
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-extrabold text-base block ${isCompleted ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                        >
                          {formatCurrency(order.remainingAmount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${isCompleted ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                        >
                          {isCompleted ? 'Cleared' : `(${100 - percentPaid}% Due)`}
                        </span>
                      </td>

                      {/* Payment Column */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted ? (
                          <span className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1 justify-center shadow-sm w-24 mx-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PAID</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setPayOrder(order);
                              setPayInputAmount(order.remainingAmount);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 justify-center shadow-sm transition-colors mx-auto cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Due Payment</span>
                          </button>
                        )}
                      </td>

                      {/* Actions Column (View & Edit Only - Delete Removed) */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenView(order)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors border border-blue-200 shadow-sm cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors border border-amber-200 shadow-sm cursor-pointer"
                            title="Edit Order"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
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

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of{' '}
            <strong className="text-slate-900">{filteredOrders.length}</strong> entries
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW & EDIT POPUP MODAL (MATCHING EXACT SCREENSHOT DESIGN) */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {isEditing ? 'Edit Purchase Entry' : 'Order Breakdown & Summary'}
                  </h3>
                  <p className="text-xs text-blue-400 font-mono">{viewOrder.orderNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewOrder(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {!isEditing ? (
              /* VIEW MODE */
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Customer Details:</span>
                    <span className="font-extrabold text-slate-900 text-sm block">{viewOrder.customerName}</span>
                    {viewOrder.customerMobile && (
                      <span className="font-mono text-slate-600">{viewOrder.customerMobile}</span>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Date:</span>
                    <span className="text-slate-700 font-semibold">
                      {new Date(viewOrder.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Itemized Table Breakdown */}
                <div>
                  <h4 className="font-extrabold text-slate-800 mb-2 uppercase text-[11px] tracking-wider">
                    Purchased Items Breakdown
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewOrder.items && viewOrder.items.length > 0 ? (
                          viewOrder.items.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                                {item.quantity} Pcs
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{viewOrder.productName}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                              {viewOrder.quantity} Pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(viewOrder.unitPrice)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(viewOrder.totalAmount)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-slate-700">Grand Total Amount:</span>
                    <span className="font-extrabold text-blue-900 text-base">
                      {formatCurrency(viewOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid Amount:</span>
                    <span className="font-bold">{formatCurrency(viewOrder.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 pt-1 border-t border-slate-200 font-bold text-sm">
                    <span>Remaining Balance Due:</span>
                    <span>{formatCurrency(viewOrder.remainingAmount)}</span>
                  </div>
                </div>

                {viewOrder.notes && (
                  <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                    <span className="font-bold block text-[10px] text-slate-400 uppercase">Notes:</span>
                    {viewOrder.notes}
                  </div>
                )}
              </div>
            ) : (
              /* EDIT FORM MODE (MATCHING EXACT SCREENSHOT DESIGN) */
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Customer Name & Mobile 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                      CUSTOMER NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      placeholder="e.g. Rahul Interior Works"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                      CUSTOMER MOBILE
                    </label>
                    <input
                      type="text"
                      value={editForm.customerMobile}
                      onChange={(e) => setEditForm({ ...editForm, customerMobile: e.target.value })}
                      placeholder="9820012345"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                {/* SELECTED PRODUCTS & ITEMS TABLE */}
                <div className="space-y-2 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <span>SELECTED PRODUCTS & ITEMS ({editForm.items.length})</span>
                    </label>

                    {/* TOP-RIGHT CORNER + ADD ITEM BUTTON */}
                    <button
                      type="button"
                      onClick={handleAddEditEmptyRow}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl shadow-xs relative z-20">
                    <div className="overflow-visible">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-12">Sr No.</th>
                            <th className="py-2.5 px-3">Product Name</th>
                            <th className="py-2.5 px-3 text-center w-28">Qty (Pcs)</th>
                            <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                            <th className="py-2.5 px-3 text-right w-32">Subtotal (₹)</th>
                            <th className="py-2.5 px-3 text-center w-24">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {editForm.items.map((item, idx) => {
                            const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
                            return (
                              <tr key={idx} style={{ zIndex: 100 - idx }} className="relative hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                                  {idx + 1}
                                </td>
                                <td style={{ zIndex: 100 - idx }} className="py-2.5 px-3 relative">
                                  <SearchableProductCombobox
                                    products={products}
                                    value={item.productName}
                                    placeholder="Select Product"
                                    onSelectProduct={(name, price) => {
                                      handleUpdateEditOrderItem(idx, 'productName', name, price);
                                    }}
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateEditOrderItem(idx, 'quantity', parseInt(e.target.value) || 1)
                                    }
                                    className="w-16 p-2 text-center bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      handleUpdateEditOrderItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 p-2 text-right bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900">
                                  {formatCurrency(subtotal)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditOrderItem(idx)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete row"
                                  >
                                    <X className="w-4 h-4 text-rose-500" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* GRAND TOTAL ROW AT BOTTOM OF TABLE */}
                    <div className="p-3.5 bg-blue-50/90 border-t border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <div className="text-slate-600 font-medium">
                        Total Products: <strong className="text-slate-900">{editForm.items.length}</strong> | Total Quantity:{' '}
                        <strong className="text-slate-900">
                          {editForm.items.reduce((s, i) => s + (i.quantity || 0), 0)} Pcs
                        </strong>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="font-bold text-slate-700">Recalculated Grand Total:</span>
                        <span className="font-extrabold text-blue-950 text-base bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                          {formatCurrency(editForm.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Paid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.paidAmount}
                    onChange={(e) => setEditForm({ ...editForm, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-extrabold font-mono text-emerald-800 outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NEW PURCHASE ENTRY MODAL (WITH LIVE SEARCHABLE CUSTOMER & INLINE PRODUCT TABLE) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Purchase Entry</h3>
                  <p className="text-xs text-blue-400">Searchable customer auto-fill & inline table product entry</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* ⚡ LIVE SEARCHABLE REGULAR CUSTOMER COMBOBOX */}
              {customers.length > 0 && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
                  <label className="font-extrabold text-blue-950 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>⚡ Search & Select Saved Regular Customer</span>
                  </label>
                  <SearchableCustomerCombobox
                    customers={customers}
                    onSelectCustomer={handleSelectSavedCustomer}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Interior Works"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Customer Mobile
                  </label>
                  <input
                    type="text"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="9820012345"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* SELECTED PRODUCTS & ITEMS TABLE */}
              <div className="space-y-2 border-t border-b border-slate-100 py-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>SELECTED PRODUCTS & ITEMS ({orderItems.length})</span>
                  </label>

                  {/* TOP-RIGHT CORNER + ADD ITEM BUTTON */}
                  <button
                    type="button"
                    onClick={handleAddEmptyRow}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl shadow-xs relative z-20">
                  <div className="overflow-visible">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">SR NO.</th>
                          <th className="py-2.5 px-3">PRODUCT NAME</th>
                          <th className="py-2.5 px-3 text-center w-28">QTY (PCS)</th>
                          <th className="py-2.5 px-3 text-right w-28">RATE (₹)</th>
                          <th className="py-2.5 px-3 text-right w-32">SUBTOTAL (₹)</th>
                          <th className="py-2.5 px-3 text-center w-24">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderItems.map((item, idx) => {
                          const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
                          return (
                            <tr key={idx} style={{ zIndex: 100 - idx }} className="relative hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                                {idx + 1}
                              </td>
                              <td style={{ zIndex: 100 - idx }} className="py-2.5 px-3 relative">
                                <SearchableProductCombobox
                                  products={products}
                                  value={item.productName}
                                  placeholder="Select Product"
                                  onSelectProduct={(name, price) => {
                                    handleUpdateOrderItem(idx, 'productName', name, price);
                                  }}
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateOrderItem(idx, 'quantity', parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 p-2 text-center bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleUpdateOrderItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20 p-2 text-right bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900">
                                {formatCurrency(subtotal)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(idx)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete row"
                                >
                                  <X className="w-4 h-4 text-rose-500" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* GRAND TOTAL SUMMARY BAR AT BOTTOM OF TABLE */}
                  <div className="p-3.5 bg-blue-50/90 border-t border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600 font-medium">
                      Total Products: <strong className="text-slate-900">{orderItems.length}</strong> | Total Quantity:{' '}
                      <strong className="text-slate-900">
                        {orderItems.reduce((s, i) => s + (i.quantity || 0), 0)} Pcs
                      </strong>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="font-bold text-slate-700">Calculated Grand Total:</span>
                      <span className="font-extrabold text-blue-950 text-base bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                        {formatCurrency(calculateNewOrderGrandTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADVANCE PAID AMOUNT GREEN BOX */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  ADVANCE PAID AMOUNT (₹)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50% advance or full payment"
                  className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-extrabold font-mono text-emerald-800 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Remaining Due Balance:{' '}
                  <strong className="text-amber-600 font-mono">
                    {formatCurrency(Math.max(0, calculateNewOrderGrandTotal() - paidAmount))}
                  </strong>
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewOrderForm();
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {loading ? 'Saving Entry...' : 'Save Multi-Product Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record Payment</h3>
              <button onClick={() => setPayOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{payOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-800">{payOrder.productName} ({payOrder.quantity} Pcs)</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-slate-200">
                <span>Remaining Due:</span>
                <span className="text-sm">{formatCurrency(payOrder.remainingAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Enter Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={payInputAmount}
                  onChange={(e) => setPayInputAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-base font-extrabold font-mono text-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayOrder(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  {loading ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
