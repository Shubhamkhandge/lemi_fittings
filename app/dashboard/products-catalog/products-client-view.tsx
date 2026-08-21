'use client';

import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/calculations/financials';
import {
  PackagePlus,
  X,
  Eye,
  Pencil,
  Trash2,
  Search,
  Package,
  Layers,
  IndianRupee,
  Boxes,
  AlertTriangle,
  Save
} from 'lucide-react';
import { addProduct, updateProduct, deleteProduct } from '@/lib/actions/orders';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ProductsClientView({ products }: { products: any[] }) {
  const router = useRouter();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewProductItem, setViewProductItem] = useState<any | null>(null);
  const [editProductItem, setEditProductItem] = useState<any | null>(null);
  const [deleteProductItem, setDeleteProductItem] = useState<any | null>(null);

  // Form States
  const [loading, setLoading] = useState(false);

  // Add Product Form
  const [addForm, setAddForm] = useState({
    name: '',
    price: 200,
    unit: 'Pcs',
    stock: 100,
  });

  // Edit Product Form
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    unit: 'Pcs',
    stock: 100,
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = unitFilter === 'ALL' || p.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });
  }, [products, searchTerm, unitFilter]);

  // Catalog Metrics
  const totalProducts = products.length;
  const avgPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round(products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length);
  }, [products]);

  const totalStock = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock ?? 100), 0);
  }, [products]);

  const unitVariety = useMemo(() => {
    return new Set(products.map((p) => p.unit)).size;
  }, [products]);

  // Handle Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error('Please enter product name');
      return;
    }

    setLoading(true);
    try {
      await addProduct(addForm.name.trim(), addForm.price, addForm.unit, addForm.stock);
      toast.success(`Product "${addForm.name.trim()}" added to catalog!`);
      setShowAddModal(false);
      setAddForm({ name: '', price: 200, unit: 'Pcs', stock: 100 });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditProductItem(p);
    setEditForm({
      name: p.name || '',
      price: p.price || 0,
      unit: p.unit || 'Pcs',
      stock: p.stock ?? 100,
    });
  };

  // Handle Save Edit Product
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductItem || !editForm.name.trim()) return;

    setLoading(true);
    try {
      await updateProduct(editProductItem.id, editForm);
      toast.success(`Product "${editForm.name.trim()}" updated successfully!`);
      setEditProductItem(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirm Delete Product
  const handleConfirmDelete = async () => {
    if (!deleteProductItem) return;

    setLoading(true);
    try {
      await deleteProduct(deleteProductItem.id);
      toast.success(`Product "${deleteProductItem.name}" deleted from catalog`);
      setDeleteProductItem(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* 📊 SUMMARY METRICS HEADER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Products</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalProducts} <span className="text-xs font-semibold text-slate-400 font-sans">Items</span></span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Selling Price</span>
            <span className="text-2xl font-extrabold text-blue-700 font-mono mt-1 block">{formatCurrency(avgPrice)}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Catalog Stock</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono mt-1 block">{totalStock} <span className="text-xs font-semibold text-amber-500/80 font-sans">Units</span></span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unit Categories</span>
            <span className="text-2xl font-extrabold text-indigo-600 font-mono mt-1 block">{unitVariety} <span className="text-xs font-semibold text-indigo-400 font-sans">Types</span></span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🔍 CONTROL BAR: SEARCH, UNIT FILTER & ADD BUTTON */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Live Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs"
            />
          </div>

          {/* Unit Filter Dropdown */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full sm:w-44 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs"
          >
            <option value="ALL">All Units</option>
            <option value="Pcs">Pcs</option>
            <option value="Pair">Pair</option>
            <option value="Meter">Meter</option>
            <option value="Set">Set</option>
            <option value="Box">Box</option>
          </select>
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-blue-600/25 transition-all whitespace-nowrap cursor-pointer shrink-0 w-full sm:w-auto justify-center"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 📋 PRODUCTS CATALOG TABLE WITH ACTIONS (VIEW, EDIT, DELETE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">SR NO.</th>
                <th className="py-3.5 px-4">PRODUCT NAME</th>
                <th className="py-3.5 px-4 text-right">SELLING PRICE (₹)</th>
                <th className="py-3.5 px-4 text-center">UNIT</th>
                <th className="py-3.5 px-4 text-center">STOCK LEVEL</th>
                <th className="py-3.5 px-4 text-center w-36">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold font-mono text-slate-900 text-sm">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200/80 font-mono text-slate-700 text-[11px] font-bold rounded-lg">
                        {p.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-extrabold rounded-lg inline-flex items-center space-x-1">
                        <span>{p.stock ?? 100}</span>
                        <span className="text-[10px] text-emerald-600 uppercase font-sans">{p.unit}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* 👁️ VIEW BUTTON */}
                        <button
                          type="button"
                          onClick={() => setViewProductItem(p)}
                          className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200"
                          title="View product details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* ✏️ EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-amber-200"
                          title="Edit product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* 🗑️ DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setDeleteProductItem(p)}
                          className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium italic">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ➕ ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-base shadow-sm">
                  <PackagePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Add LEMI Product</h3>
                  <p className="text-xs text-blue-400">Add new product item to billing catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  PRODUCT NAME *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Soft-Close Hydraulic Hinge 35mm"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    SELLING PRICE (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    UNIT *
                  </label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Pair">Pair</option>
                    <option value="Meter">Meter</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  INITIAL STOCK UNITS
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.stock}
                  onChange={(e) => setAddForm({ ...addForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👁️ VIEW PRODUCT DETAILS MODAL */}
      {viewProductItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col space-y-4 p-5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Product Details</h3>
              </div>
              <button onClick={() => setViewProductItem(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Product Name:</span>
                <span className="font-extrabold text-slate-900 text-base block">{viewProductItem.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Selling Price:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  {formatCurrency(viewProductItem.price)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Stock Unit:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  {viewProductItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Available Stock:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {viewProductItem.stock ?? 100} {viewProductItem.unit}
                </span>
              </div>
              {viewProductItem.createdAt && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                  <span>Created At:</span>
                  <span>{new Date(viewProductItem.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setViewProductItem(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT PRODUCT MODAL */}
      {editProductItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-extrabold text-base shadow-sm">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Product</h3>
                  <p className="text-xs text-amber-300">Modify product details & price</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditProductItem(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  PRODUCT NAME *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    SELLING PRICE (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                    UNIT *
                  </label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Pair">Pair</option>
                    <option value="Meter">Meter</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                  STOCK LEVEL
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProductItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel Edit
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE PRODUCT CONFIRMATION MODAL */}
      {deleteProductItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete Product?</h3>
                <p className="text-slate-500 text-xs">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-slate-800">
              <span className="font-bold block text-[10px] text-rose-600 uppercase mb-0.5">Product to delete:</span>
              <strong className="text-slate-900 text-sm font-extrabold">{deleteProductItem.name}</strong>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductItem(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
