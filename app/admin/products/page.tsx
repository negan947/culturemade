'use client';

import { 
  Edit3, 
  Eye, 
  Package, 
  Plus, 
  Search, 
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  DollarSign,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

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
          console.error('Error fetching products:', productsResult.error);
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
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Search filter
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category && product.category_name !== filters.category) {
        return false;
      }

      // Price range filter
      const price = parseFloat(product.price);
      if (filters.priceMin && price < parseFloat(filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && price > parseFloat(filters.priceMax)) {
        return false;
      }

      // Inventory level filter
      if (filters.inventoryLevel) {
        switch (filters.inventoryLevel) {
          case 'in_stock':
            if (product.inventory_total <= 10) return false;
            break;
          case 'low_stock':
            if (product.inventory_total === 0 || product.inventory_total > 10) return false;
            break;
          case 'out_of_stock':
            if (product.inventory_total > 0) return false;
            break;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sort.field];
      let bVal: any = b[sort.field];

      // Handle different data types
      if (sort.field === 'price') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (sort.field === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, filters, sort]);

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priceMin: '',
      priceMax: '',
      inventoryLevel: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  if (isLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
        </div>
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <ProductTableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Products
          </h1>
          <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
            Manage your product catalog and inventory • {filteredAndSortedProducts.length} of {products.length} products
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
        <div className='space-y-4'>
          {/* First Row: Search and Quick Filters */}
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled' />
              <input
                type='text'
                placeholder='Search products...'
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className='w-full pl-10 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              />
            </div>
            
            {/* Status Filter */}
            <div className='relative'>
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className='appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              >
                <option value=''>All Status</option>
                <option value='active'>Active</option>
                <option value='draft'>Draft</option>
                <option value='archived'>Archived</option>
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none' />
            </div>

            {/* Category Filter */}
            <div className='relative'>
              <select 
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className='appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              >
                <option value=''>All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value={""}>Uncategorized</option>
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none' />
            </div>

            {/* Inventory Filter */}
            <div className='relative'>
              <select 
                value={filters.inventoryLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, inventoryLevel: e.target.value }))}
                className='appearance-none bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg px-4 py-2 pr-8 text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              >
                <option value=''>All Inventory</option>
                <option value='in_stock'>In Stock</option>
                <option value='low_stock'>Low Stock</option>
                <option value='out_of_stock'>Out of Stock</option>
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled pointer-events-none' />
            </div>
          </div>

          {/* Second Row: Price Range, Quick Filters, and Clear Filters */}
          <div className='flex flex-col sm:flex-row items-center gap-4'>
            {/* Quick Status Filters */}
            <div className='flex items-center space-x-2'>
              <span className='text-xs text-admin-light-text-disabled dark:text-admin-text-disabled'>Quick filters:</span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'active' ? '' : 'active' }))}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                  filters.status === 'active'
                    ? 'bg-admin-success/20 text-admin-success'
                    : 'bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary hover:bg-admin-success/10'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'draft' ? '' : 'draft' }))}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                  filters.status === 'draft'
                    ? 'bg-admin-warning/20 text-admin-warning'
                    : 'bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary hover:bg-admin-warning/10'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, inventoryLevel: prev.inventoryLevel === 'out_of_stock' ? '' : 'out_of_stock' }))}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                  filters.inventoryLevel === 'out_of_stock'
                    ? 'bg-admin-error/20 text-admin-error'
                    : 'bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary hover:bg-admin-error/10'
                }`}
              >
                Out of Stock
              </button>
            </div>

            <div className='w-px h-4 bg-admin-light-border-soft dark:border-admin-border-soft hidden sm:block' />

            {/* Price Range */}
            <div className='flex items-center space-x-2'>
              <DollarSign className='h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled' />
              <input
                type='number'
                placeholder='Min price'
                value={filters.priceMin}
                onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                className='w-24 px-3 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              />
              <span className='text-admin-light-text-disabled dark:text-admin-text-disabled'>to</span>
              <input
                type='number'
                placeholder='Max price'
                value={filters.priceMax}
                onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                className='w-24 px-3 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200'
              />
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className='inline-flex items-center px-3 py-2 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent transition-colors duration-200'
              >
                <X className='h-4 w-4 mr-1' />
                Clear filters ({activeFiltersCount})
              </button>
            )}

            {/* Results Stats */}
            <div className='flex-1 flex justify-end'>
              <div className='flex items-center space-x-4 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary'>
                <span className='flex items-center space-x-1'>
                  <Package className='h-4 w-4' />
                  <span>{filteredAndSortedProducts.length} products</span>
                </span>
                <span className='flex items-center space-x-1'>
                  <BarChart3 className='h-4 w-4' />
                  <span>{filteredAndSortedProducts.reduce((sum, p) => sum + p.inventory_total, 0)} total inventory</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className='bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden'>
        <div className="p-6">
          <ProductsTable 
            products={filteredAndSortedProducts} 
            sort={sort}
            onSort={handleSort}
          />
        </div>
      </div>
    </div>
  );
}