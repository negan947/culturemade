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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';


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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  priceMin: string;
  priceMax: string;
  inventoryLevel: string;
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
  onSort 
}: { 
  products: Product[];
  sort: SortState;
  onSort: (field: SortState['field']) => void;
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-admin-light-border dark:border-admin-border">
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    category: '',
    priceMin: '',
    priceMax: '',
    inventoryLevel: ''
  });
  const [sort, setSort] = useState<SortState>({
    field: 'created_at',
    direction: 'desc'
  });

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

        // Load products and categories
        const [productsResult, categoriesResult] = await Promise.all([
          supabase
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
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('id, name, slug')
            .order('name')
        ]);

        if (productsResult.error) {
        } else {
          const formattedProducts = productsResult.data.map(product => ({
            id: product.id,
            name: product.name,
            status: product.status as 'active' | 'draft' | 'archived',
            price: product.price,
            compare_at_price: product.compare_at_price,
            created_at: product.created_at,
            variant_count: product.product_variants?.length || 0,
            category_name: (product.product_categories as any)?.[0]?.categories?.name || null,
            inventory_total: product.product_variants?.reduce((sum: number, variant: any) => 
              sum + (variant.quantity || 0), 0) || 0
          }));
          setProducts(formattedProducts);
        }

        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Admin Products</h1>
      {/* Add products list here */}
    </div>
  );
}
