'use client';

import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';


import { createClient } from '@/lib/supabase/client';

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

interface FormData {
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  price: string;
  compare_at_price: string;
  cost_price: string;
  sku: string;
  featured: boolean;
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  category_ids: string[];
}


function EditProductForm({ 
  product, 
  categories,
  onSave,
  isLoading 
}: { 
  product: Product; 
  categories: Category[];
  onSave: (data: FormData) => Promise<void>;
  isLoading: boolean;
}) {
  const selectedCategoryIds = product.product_categories.map(pc => pc.categories.id);
  const [formData, setFormData] = useState<FormData>({
    name: product.name,
    description: product.description || '',
    status: product.status,
    price: product.price,
    compare_at_price: product.compare_at_price || '',
    cost_price: product.cost_price || '',
    sku: product.sku || '',
    featured: product.featured,
    track_inventory: product.track_inventory,
    continue_selling_when_out_of_stock: product.continue_selling_when_out_of_stock,
    category_ids: selectedCategoryIds
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category_ids: checked 
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter(id => id !== categoryId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
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
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'draft' | 'archived')}
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
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
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
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
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
                value={formData.compare_at_price}
                onChange={(e) => handleInputChange('compare_at_price', e.target.value)}
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
                value={formData.cost_price}
                onChange={(e) => handleInputChange('cost_price', e.target.value)}
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
                checked={formData.category_ids.includes(category.id)}
                onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
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
              checked={formData.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Featured Product
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.track_inventory}
              onChange={(e) => handleInputChange('track_inventory', e.target.checked)}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Track Inventory
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.continue_selling_when_out_of_stock}
              onChange={(e) => handleInputChange('continue_selling_when_out_of_stock', e.target.checked)}
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Continue selling when out of stock
            </span>
          </label>
        </div>
      </div>
      {/* Save Button at bottom of form */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className='inline-flex items-center bg-admin-accent text-white px-6 py-3 rounded-lg hover:bg-admin-accent-hover shadow-admin-soft hover:shadow-admin-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default function EditProduct({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

        // Load product and categories
        const [productResult, categoriesResult] = await Promise.all([
          supabase
            .from('products')
            .select(`
              *,
              product_variants(*),
              product_categories(
                categories(id, name, slug)
              )
            `)
            .eq('id', id)
            .single(),
          supabase
            .from('categories')
            .select('id, name, slug')
            .order('name')
        ]);

        if (productResult.error || !productResult.data) {
          setError('Product not found');
          return;
        }

        setProduct(productResult.data);
        setCategories(categoriesResult.data || []);
      } catch (err) {
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  const handleSave = async (formData: FormData) => {
    if (!product) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          price: formData.price,
          compare_at_price: formData.compare_at_price || null,
          cost_price: formData.cost_price || null,
          sku: formData.sku || null,
          featured: formData.featured,
          track_inventory: formData.track_inventory,
          continue_selling_when_out_of_stock: formData.continue_selling_when_out_of_stock,
          category_ids: formData.category_ids
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      setSuccessMessage('Product updated successfully!');
      
      // Update local product state
      setProduct(prev => prev ? { ...prev, ...result.data } : null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-admin-accent" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return null;
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
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Form */}
      <EditProductForm 
        product={product} 
        categories={categories} 
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  );
}