import { Suspense } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

interface Category {
  id: string;
  name: string;
  slug: string;
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

function NewProductForm({ categories }: { categories: Category[] }) {
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
                className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
              />
              <span className="text-admin-light-text-primary dark:text-admin-text-primary">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Product Images
        </h2>
        
        <div className="border-2 border-dashed border-admin-light-border-soft dark:border-admin-border-soft rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
          <h3 className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
            Upload product images
          </h3>
          <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
            Drag and drop your images here, or click to browse
          </p>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </button>
          <p className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-4">
            Supports: JPG, PNG, WEBP up to 10MB each
          </p>
        </div>
      </div>

      {/* Product Variants */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Product Variants
          </h2>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </button>
        </div>

        {/* Variant Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Option Name (e.g., Size, Color)
            </label>
            <input
              type="text"
              placeholder="Size"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Option Values (comma separated)
            </label>
            <input
              type="text"
              placeholder="S, M, L, XL"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>
        </div>

        {/* Sample Variant Table */}
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
              <tr className="border-b border-admin-light-border-soft dark:border-admin-border-soft">
                <td className="py-3 px-4 text-admin-light-text-secondary dark:text-admin-text-secondary text-sm">
                  No variants created yet
                </td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-6">
          Search Engine Optimization
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Page Title
            </label>
            <input
              type="text"
              placeholder="Auto-generated from product name"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Meta Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description for search engines"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200 resize-vertical"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              URL Handle
            </label>
            <input
              type="text"
              placeholder="auto-generated-from-name"
              className="w-full px-4 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent transition-colors duration-200"
            />
          </div>
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
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Featured Product
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-admin-accent bg-admin-light-bg-main dark:bg-admin-bg-main border-admin-light-border-soft dark:border-admin-border-soft rounded focus:ring-admin-accent focus:ring-2"
            />
            <span className="text-admin-light-text-primary dark:text-admin-text-primary">
              Track Inventory
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
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

export default async function NewProduct() {
  await requireAdmin();

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
              Add New Product
            </h1>
            <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
              Create a new product for your catalog
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
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
            Save Product
          </button>
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<div>Loading form...</div>}>
        <NewProductForm categories={await getCategories()} />
      </Suspense>
    </div>
  );
}