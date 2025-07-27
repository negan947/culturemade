import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Upload,
  Eye,
  EyeOff,
  Edit3,
  Trash2
} from 'lucide-react';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

interface Product {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'draft' | 'archived';
  price: string;
  compare_at_price: string | null;
  cost_price: string | null;
  sku: string | null;
  featured: boolean;
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  created_at: string;
  product_variants: ProductVariant[];
  product_categories: { categories: { id: string; name: string; slug: string } }[];
}

interface ProductVariant {
  id: string;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string | null;
  compare_at_price: string | null;
  cost_price: string | null;
  sku: string | null;
  quantity: number;
  position: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variants(*),
      product_categories(
        categories(id, name, slug)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

function EditProductForm({ 
  product, 
  categories 
}: { 
  product: Product; 
  categories: Category[] 
}) {
  const selectedCategoryIds = product.product_categories.map(pc => pc.categories.id);

  return (
    <form className="space-y-8">
      {/* Basic Information */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Basic Information
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              defaultValue={product.name}
              placeholder="Enter product name"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              SKU
            </label>
            <input
              type="text"
              defaultValue={product.sku || ''}
              placeholder="Auto-generated if empty"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Status *
            </label>
            <select
              required
              defaultValue={product.status}
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Description
            </label>
            <textarea
              rows={4}
              defaultValue={product.description || ''}
              placeholder="Product description"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200 resize-vertical"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Pricing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-admin-light-text-secondary dark:text-admin-text-secondary">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={product.price}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Compare At Price */}
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Compare At Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-admin-light-text-secondary dark:text-admin-text-secondary">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.compare_at_price || ''}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
              />
            </div>
            <p className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-1">
              Original price before discount
            </p>
          </div>

          {/* Cost Per Item */}
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Cost Per Item
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-admin-light-text-secondary dark:text-admin-text-secondary">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.cost_price || ''}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
              />
            </div>
            <p className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-1">
              For profit margin calculation
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Categories
        </h2>
        
        <div className="space-y-4">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                value={category.id}
                defaultChecked={selectedCategoryIds.includes(category.id)}
                className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
              />
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Variants */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Product Variants ({product.product_variants.length})
          </h2>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </button>
        </div>

        {/* Variants Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-light-border-soft dark:border-admin-border-soft">
                <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  Variant
                </th>
                <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  SKU
                </th>
                <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  Price
                </th>
                <th className="text-left py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  Inventory
                </th>
                <th className="text-right py-3 px-4 font-medium text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {product.product_variants.length === 0 ? (
                <tr className="border-b border-admin-light-border-soft dark:border-admin-border-soft">
                  <td className="py-4 px-4 text-admin-light-text-secondary dark:text-admin-text-secondary text-sm" colSpan={5}>
                    No variants found. Create variants to manage different sizes, colors, or options.
                  </td>
                </tr>
              ) : (
                product.product_variants.map((variant) => (
                  <tr 
                    key={variant.id} 
                    className="border-b border-admin-light-border-soft dark:border-admin-border-soft hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-150"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                        {variant.title}
                      </div>
                      <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                        {[variant.option1, variant.option2, variant.option3]
                          .filter(Boolean)
                          .join(' / ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        defaultValue={variant.sku || ''}
                        placeholder="SKU"
                        className="w-full px-2 py-1 text-sm bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-accent"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-admin-light-text-secondary dark:text-admin-text-secondary">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={variant.price || product.price}
                          className="w-full pl-6 pr-2 py-1 text-sm bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-accent"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        defaultValue={variant.quantity}
                        className="w-full px-2 py-1 text-sm bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-accent"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          className="p-1 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
                          title="Edit variant"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-error transition-colors duration-200"
                          title="Delete variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Additional Settings
        </h2>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked={product.featured}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Featured Product
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked={product.track_inventory}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Track Inventory
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked={product.continue_selling_when_out_of_stock}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Continue selling when out of stock
            </span>
          </label>
        </div>
      </div>
    </form>
  );
}

export default async function EditProduct({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAdmin();

  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
              Edit Product
            </h1>
            <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
              {product.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/admin/products/${product.id}`}
            className='inline-flex items-center px-4 py-2 border border-admin-light-border-soft dark:border-admin-border-soft text-admin-light-text-secondary dark:text-admin-text-secondary rounded-lg hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-200'
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
          <Link
            href="/admin/products"
            className='inline-flex items-center px-4 py-2 border border-admin-light-border-soft dark:border-admin-border-soft text-admin-light-text-secondary dark:text-admin-text-secondary rounded-lg hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors duration-200'
          >
            Cancel
          </Link>
          <button
            type="submit"
            className='inline-flex items-center bg-admin-accent text-white px-4 py-2 rounded-lg hover:bg-admin-accent-hover shadow-admin-soft hover:shadow-admin-glow transition-all duration-200'
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<div>Loading product...</div>}>
        <EditProductForm product={product} categories={categories} />
      </Suspense>
    </div>
  );
}