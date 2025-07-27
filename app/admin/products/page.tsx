import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Edit3, 
  Eye, 
  Package, 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  MoreHorizontal,
  Trash2
} from 'lucide-react';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

interface Product {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'archived';
  price: string;
  compare_at_price: string | null;
  created_at: string;
  variant_count: number;
  category_name: string | null;
  inventory_total: number;
}

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      status,
      price,
      compare_at_price,
      created_at,
      product_variants!inner(id, quantity),
      product_categories!left(
        categories!inner(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data.map(product => ({
    id: product.id,
    name: product.name,
    status: product.status as 'active' | 'draft' | 'archived',
    price: product.price,
    compare_at_price: product.compare_at_price,
    created_at: product.created_at,
    variant_count: product.product_variants?.length || 0,
    category_name: product.product_categories?.[0]?.categories?.name || null,
    inventory_total: product.product_variants?.reduce((sum: number, variant: any) => 
      sum + (variant.quantity || 0), 0) || 0
  }));
}

function ProductTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ProductsTable({ products }: { products: Product[] }) {
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-admin-success/20 text-admin-success`;
      case 'draft':
        return `${baseClasses} bg-admin-warning/20 text-admin-warning`;
      case 'archived':
        return `${baseClasses} bg-admin-error/20 text-admin-error`;
      default:
        return `${baseClasses} bg-admin-light-bg-hover dark:bg-admin-bg-hover text-admin-light-text-secondary dark:text-admin-text-secondary`;
    }
  };

  const getInventoryStatus = (total: number) => {
    if (total === 0) return { label: 'Out of stock', class: 'text-admin-error' };
    if (total <= 10) return { label: 'Low stock', class: 'text-admin-warning' };
    return { label: 'In stock', class: 'text-admin-success' };
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
        <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
          No products found
        </h3>
        <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-6">
          Get started by creating your first product.
        </p>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-admin-light-border dark:border-admin-border">
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Product
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Price
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Inventory
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Category
            </th>
            <th className="text-right py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const inventoryStatus = getInventoryStatus(product.inventory_total);
            return (
              <tr 
                key={product.id} 
                className="border-b border-admin-light-border-soft dark:border-admin-border-soft hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-150"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-admin-light-text-disabled dark:text-admin-text-disabled" />
                    </div>
                    <div>
                      <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                        {product.name}
                      </div>
                      <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {product.variant_count} variant{product.variant_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={getStatusBadge(product.status)}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-admin-light-text-primary dark:text-admin-text-primary font-medium">
                    ${product.price}
                  </div>
                  {product.compare_at_price && (
                    <div className="text-sm text-admin-light-text-disabled dark:text-admin-text-disabled line-through">
                      ${product.compare_at_price}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className={`font-medium ${inventoryStatus.class}`}>
                    {product.inventory_total}
                  </div>
                  <div className={`text-sm ${inventoryStatus.class}`}>
                    {inventoryStatus.label}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-admin-light-text-secondary dark:text-admin-text-secondary">
                    {product.category_name || 'Uncategorized'}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
                      title="View product"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
                      title="Edit product"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-error transition-colors duration-200"
                      title="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminProducts() {
  await requireAdmin();

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Products
          </h1>
          <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
            Manage your product catalog and inventory
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className='inline-flex items-center bg-admin-accent text-white px-4 py-2 rounded-lg hover:bg-admin-accent-hover shadow-admin-soft hover:shadow-admin-glow transition-all duration-200 w-full sm:w-auto justify-center'
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Search and Filters */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search */}
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled' />
            <input
              type='text'
              placeholder='Search products...'
              className='w-full pl-10 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
            />
          </div>
          
          {/* Status Filter */}
          <div className='relative'>
            <select className='appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'>
              <option value=''>All Status</option>
              <option value='active'>Active</option>
              <option value='draft'>Draft</option>
              <option value='archived'>Archived</option>
            </select>
            <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none' />
          </div>

          {/* Category Filter */}
          <div className='relative'>
            <select className='appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'>
              <option value=''>All Categories</option>
              <option value='accessories'>Accessories</option>
              <option value='clothing'>Clothing</option>
            </select>
            <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none' />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden'>
        <Suspense fallback={<div className="p-6"><ProductTableSkeleton /></div>}>
          <div className="p-6">
            <ProductsTable products={await getProducts()} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
