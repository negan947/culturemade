import { Upload, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { createClient } from '@/lib/supabase/server';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  position: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  product_images: ProductImage[];
}

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_images(*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    product_images: data.product_images?.sort((a, b) => a.position - b.position) || []
  };
}

function ProductImageManager({ product }: { product: Product }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">
            Product Images
          </h1>
          <p className="mt-1 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
            Manage images for {product.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${product.id}`}
            className="px-4 py-2 text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-light-text-primary dark:hover:text-admin-text-primary border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg hover:border-admin-light-border dark:hover:border-admin-border transition-colors"
          >
            Back to Product
          </Link>
          <button className="px-4 py-2 text-sm font-medium text-white bg-admin-accent hover:bg-admin-accent-hover rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Images
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-admin-light-border-soft dark:border-admin-border-soft rounded-xl p-8 text-center hover:border-admin-accent/50 transition-colors">
        <Upload className="w-12 h-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
        <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
          Upload Product Images
        </h3>
        <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mb-4">
          Drag and drop images here, or click to browse
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-admin-accent hover:text-admin-accent-hover border border-admin-accent hover:border-admin-accent-hover rounded-lg cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4" />
          Choose Files
        </label>
        <p className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-2">
          Supports JPG, PNG, WebP up to 5MB each
        </p>
      </div>

      {/* Current Images */}
      <div>
        <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4">
          Current Images ({product.product_images.length})
        </h2>
        
        {product.product_images.length === 0 ? (
          <div className="text-center py-12 bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-xl border border-admin-light-border-soft dark:border-admin-border-soft">
            <ImageIcon className="w-16 h-16 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
            <h3 className="text-lg font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
              No images uploaded
            </h3>
            <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
              Upload your first product image to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {product.product_images.map((image, index) => (
              <div
                key={image.id}
                className="group relative bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-xl border border-admin-light-border-soft dark:border-admin-border-soft overflow-hidden hover:border-admin-accent/50 transition-colors"
              >
                {/* Image */}
                <div className="aspect-square bg-admin-light-bg-main dark:bg-admin-bg-main flex items-center justify-center">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Image Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                      Image {image.position}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-admin-light-text-secondary dark:text-admin-text-secondary hover:text-admin-warning transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Alt text (optional)"
                    defaultValue={image.alt_text || ''}
                    className="w-full px-2 py-1 text-xs bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded text-admin-light-text-primary dark:text-admin-text-primary placeholder-admin-light-text-disabled dark:placeholder-admin-text-disabled focus:outline-none focus:ring-1 focus:ring-admin-accent"
                  />
                </div>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white bg-admin-accent rounded">
                    Primary
                  </div>
                )}

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-black/50 rounded flex items-center justify-center cursor-move">
                    <div className="grid grid-cols-2 gap-0.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Settings */}
      {product.product_images.length > 0 && (
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-xl border border-admin-light-border-soft dark:border-admin-border-soft p-6">
          <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary mb-4">
            Image Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                Image Quality
              </label>
              <select className="w-full px-3 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent">
                <option value="high">High Quality (Original)</option>
                <option value="medium">Medium Quality (Compressed)</option>
                <option value="low">Low Quality (Highly Compressed)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                Auto-optimize
              </label>
              <select className="w-full px-3 py-2 bg-admin-light-bg-main dark:bg-admin-bg-main border border-admin-light-border-soft dark:border-admin-border-soft rounded-lg text-admin-light-text-primary dark:text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-accent">
                <option value="true">Enabled (WebP conversion)</option>
                <option value="false">Disabled (Original format)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductImagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
          <div className="h-4 w-32 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
          <div className="h-10 w-28 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
        </div>
      </div>
      
      <div className="h-32 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-xl animate-pulse" />
      
      <div>
        <div className="h-6 w-40 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-xl border border-admin-light-border-soft dark:border-admin-border-soft overflow-hidden">
              <div className="aspect-square bg-admin-light-bg-hover dark:bg-admin-bg-hover animate-pulse" />
              <div className="p-4">
                <div className="h-4 w-16 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse mb-2" />
                <div className="h-6 w-full bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProductImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<ProductImagesSkeleton />}>
        <ProductImageManager product={product} />
      </Suspense>
    </div>
  );
}