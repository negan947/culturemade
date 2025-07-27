import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit3, 
  Package, 
  DollarSign,
  BarChart3,
  Eye,
  Calendar,
  Tag,
  Boxes,
  Image as ImageIcon
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
  updated_at: string;
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

function ProductOverview({ product }: { product: Product }) {
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
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

  const totalInventory = product.product_variants.reduce((sum, variant) => 
    sum + variant.quantity, 0
  );

  const avgPrice = product.product_variants.length > 0
    ? product.product_variants.reduce((sum, variant) => 
        sum + parseFloat(variant.price || product.price), 0
      ) / product.product_variants.length
    : parseFloat(product.price);

  const profitMargin = product.cost_price 
    ? ((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.price) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-admin-light-text-disabled dark:text-admin-text-disabled" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary mb-2 break-words">
                {product.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className={getStatusBadge(product.status)}>
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </span>
                {product.featured && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-admin-accent/20 text-admin-accent">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:flex-shrink-0">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="inline-flex items-center justify-center px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors duration-200 w-full sm:w-auto text-sm font-medium"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Product
            </Link>
            <Link
              href={`/admin/products/${product.id}/images`}
              className="inline-flex items-center justify-center px-4 py-2 border border-admin-accent text-admin-accent rounded-lg hover:bg-admin-accent hover:text-white transition-colors duration-200 w-full sm:w-auto text-sm font-medium"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Manage Images
            </Link>
          </div>
        </div>

        {product.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-2">
              Description
            </h3>
            <p className="text-admin-light-text-primary dark:text-admin-text-primary leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-admin-light-bg-main dark:bg-admin-bg-main rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">Price</p>
                <p className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  ${product.price}
                </p>
                {product.compare_at_price && (
                  <p className="text-sm text-admin-light-text-disabled dark:text-admin-text-disabled line-through">
                    ${product.compare_at_price}
                  </p>
                )}
              </div>
              <DollarSign className="h-5 w-5 text-admin-accent" />
            </div>
          </div>

          <div className="bg-admin-light-bg-main dark:bg-admin-bg-main rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">Inventory</p>
                <p className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  {totalInventory}
                </p>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  {product.product_variants.length} variant{product.product_variants.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Boxes className="h-5 w-5 text-admin-accent" />
            </div>
          </div>

          <div className="bg-admin-light-bg-main dark:bg-admin-bg-main rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">SKU</p>
                <p className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  {product.sku || 'Not set'}
                </p>
              </div>
              <Tag className="h-5 w-5 text-admin-accent" />
            </div>
          </div>

          <div className="bg-admin-light-bg-main dark:bg-admin-bg-main rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">Profit Margin</p>
                <p className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
                  {profitMargin ? `${profitMargin}%` : 'N/A'}
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-admin-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {product.product_categories.length > 0 && (
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.product_categories.map((pc) => (
              <span
                key={pc.categories.id}
                className="px-3 py-1 bg-admin-light-bg-hover dark:bg-admin-bg-hover text-admin-light-text-primary dark:text-admin-text-primary rounded-full text-sm"
              >
                {pc.categories.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Product Variants */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4">
          Product Variants ({product.product_variants.length})
        </h3>
        
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
              </tr>
            </thead>
            <tbody>
              {product.product_variants.length === 0 ? (
                <tr>
                  <td className="py-8 px-4 text-center text-admin-light-text-secondary dark:text-admin-text-secondary" colSpan={4}>
                    No variants configured for this product.
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
                    <td className="py-3 px-4 text-admin-light-text-secondary dark:text-admin-text-secondary">
                      {variant.sku || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-admin-light-text-primary dark:text-admin-text-primary font-medium">
                        ${variant.price || product.price}
                      </div>
                      {variant.compare_at_price && (
                        <div className="text-sm text-admin-light-text-disabled dark:text-admin-text-disabled line-through">
                          ${variant.compare_at_price}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        variant.quantity === 0 
                          ? 'text-admin-error' 
                          : variant.quantity <= 10 
                            ? 'text-admin-warning' 
                            : 'text-admin-success'
                      }`}>
                        {variant.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4">
          Product Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-3">
              Inventory Settings
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-admin-light-text-primary dark:text-admin-text-primary">Track inventory</span>
                <span className={`text-sm font-medium ${
                  product.track_inventory ? 'text-admin-success' : 'text-admin-light-text-disabled dark:text-admin-text-disabled'
                }`}>
                  {product.track_inventory ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-admin-light-text-primary dark:text-admin-text-primary">Continue selling when out of stock</span>
                <span className={`text-sm font-medium ${
                  product.continue_selling_when_out_of_stock ? 'text-admin-success' : 'text-admin-light-text-disabled dark:text-admin-text-disabled'
                }`}>
                  {product.continue_selling_when_out_of_stock ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-3">
              Timestamps
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
                <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                  Created: {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-admin-light-text-disabled dark:text-admin-text-disabled" />
                <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                  Updated: {new Date(product.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ViewProduct({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAdmin();

  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className='space-y-4 lg:space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <Link
          href="/admin/products"
          className="p-2 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-accent dark:hover:text-admin-accent transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className='text-xl lg:text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary'>
            Product Details
          </h1>
          <p className='text-admin-light-text-secondary dark:text-admin-text-secondary'>
            View and manage product information
          </p>
        </div>
      </div>

      {/* Product Overview */}
      <Suspense fallback={<div>Loading product...</div>}>
        <ProductOverview product={product} />
      </Suspense>
    </div>
  );
}