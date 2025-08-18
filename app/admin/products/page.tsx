'use client';

import { 
  Edit3, 
  Eye, 
  Package, 
  Plus, 
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import ProductPlaceholder from '@/components/ui/ProductPlaceholder';
import { createClient } from '@/lib/supabase/client';
import { getProductImageWithFallback } from '@/lib/utils/image-utils';


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
  image_url: string | null;
}


interface SortState {
  field: 'name' | 'price' | 'created_at' | 'inventory_total' | 'status';
  direction: 'asc' | 'desc';
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

function ProductsTable({ 
  products, 
  sort, 
  onSort,
  selected,
  onToggleOne,
  onToggleAll,
  onBulkAction
}: { 
  products: Product[];
  sort: SortState;
  onSort: (field: SortState['field']) => void;
  selected: Record<string, boolean>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onBulkAction: (action: 'activate' | 'deactivate' | 'delete') => void;
}) {
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

  const getSortIcon = (field: SortState['field']) => {
    if (sort.field !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-admin-accent" />
      : <ArrowDown className="h-4 w-4 text-admin-accent" />;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
        <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
          No products found
        </h3>
        <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-6">
          Try adjusting your filters or create a new product.
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

  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  return (
    <div className="overflow-x-auto admin-table-scroll">
      {products.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
            {selectedIds.length} selected
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onBulkAction('activate')} disabled={selectedIds.length === 0} className="px-3 py-1 text-xs bg-admin-accent text-white rounded disabled:opacity-50">Activate</button>
            <button onClick={() => onBulkAction('deactivate')} disabled={selectedIds.length === 0} className="px-3 py-1 text-xs bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded disabled:opacity-50">Deactivate</button>
            <button onClick={() => onBulkAction('delete')} disabled={selectedIds.length === 0} className="px-3 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50">Delete</button>
          </div>
        </div>
      )}
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-admin-light-border dark:border-admin-border">
            <th className="text-left py-3 px-4">
              <input aria-label="Select all products" type="checkbox" onChange={(e) => onToggleAll(e.target.checked)} />
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              <button 
                onClick={() => onSort('name')}
                className="flex items-center space-x-1 hover:text-admin-accent transition-colors"
              >
                <span>Product</span>
                {getSortIcon('name')}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              <button 
                onClick={() => onSort('status')}
                className="flex items-center space-x-1 hover:text-admin-accent transition-colors"
              >
                <span>Status</span>
                {getSortIcon('status')}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              <button 
                onClick={() => onSort('price')}
                className="flex items-center space-x-1 hover:text-admin-accent transition-colors"
              >
                <span>Price</span>
                {getSortIcon('price')}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              <button 
                onClick={() => onSort('inventory_total')}
                className="flex items-center space-x-1 hover:text-admin-accent transition-colors"
              >
                <span>Inventory</span>
                {getSortIcon('inventory_total')}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              Category
            </th>
            <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
              <button 
                onClick={() => onSort('created_at')}
                className="flex items-center space-x-1 hover:text-admin-accent transition-colors"
              >
                <span>Created</span>
                {getSortIcon('created_at')}
              </button>
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
                  <input aria-label={`Select ${product.name}`} type="checkbox" checked={!!selected[product.id]} onChange={(e) => onToggleOne(product.id, e.target.checked)} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 overflow-hidden">
                      {(() => {
                        const validImageUrl = getProductImageWithFallback(product.image_url, 'thumbnail');
                        return validImageUrl ? (
                          <Image
                            src={validImageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-lg"
                            onError={() => {
                              // Fallback handled by ProductPlaceholder
                            }}
                          />
                        ) : (
                          <ProductPlaceholder size="small" variant="icon" />
                        );
                      })()}
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
                <td className="py-4 px-4">
                  <span className="text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                    {new Date(product.created_at).toLocaleDateString()}
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

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({
    field: 'created_at',
    direction: 'desc'
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    products.forEach(p => { next[p.id] = checked; });
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: checked }));
  };

  const bulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Object.keys(selected).filter(id => selected[id]);
    if (ids.length === 0) return;
    const res = await fetch('/api/admin/products/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }) });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Bulk action failed');
      return;
    }
    // Reflect locally
    if (action === 'delete') {
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    } else {
      const status = action === 'activate' ? 'active' : 'draft';
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status } : p));
    }
    setSelected({});
  };

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        
        // Check admin authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          router.push('/');
          return;
        }

        // Load products
        const productsResult = await supabase
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
            ),
            product_images!left(url, position)
          `)
          .order('created_at', { ascending: false });

        if (productsResult.error) {
          setError('Failed to load products');
        } else {
          const formattedProducts = productsResult.data.map(product => {
            // Get the first image (lowest position) or null if no images
            const sortedImages = (product.product_images as any)?.sort((a: any, b: any) => 
              (a.position || 0) - (b.position || 0)
            );
            const firstImage = sortedImages?.[0];
            
            return {
              id: product.id,
              name: product.name,
              status: product.status as 'active' | 'draft' | 'archived',
              price: product.price,
              compare_at_price: product.compare_at_price,
              created_at: product.created_at,
              variant_count: product.product_variants?.length || 0,
              category_name: (product.product_categories as any)?.[0]?.categories?.name || null,
              inventory_total: product.product_variants?.reduce((sum: number, variant: any) => 
                sum + (variant.quantity || 0), 0) || 0,
              image_url: firstImage?.url || null
            };
          });
          setProducts(formattedProducts);
        }
      } catch {
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (isLoading) {
    return <ProductTableSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
          Error loading products
        </h3>
        <p className="text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">
            Products
          </h1>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
            Manage your product catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border admin-table-container">
        <ProductsTable 
          products={products} 
          sort={sort} 
          onSort={handleSort}
          selected={selected}
          onToggleAll={toggleAll}
          onToggleOne={toggleOne}
          onBulkAction={bulkAction}
        />
      </div>
    </div>
  );
}
