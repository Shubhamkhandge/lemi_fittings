import React from 'react';
import { getProducts } from '@/lib/actions/orders';
import { ProductsClientView } from './products-client-view';

export default async function ProductsCatalogPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">LEMI Interior Products Catalog</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage product names, default prices, and stock units
        </p>
      </div>

      <ProductsClientView products={products} />
    </div>
  );
}
