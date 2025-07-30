'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Package } from 'lucide-react';
import { memo } from 'react';

import { ProductListItem } from '@/types/api';

import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';


interface ProductGridProps {
  products: ProductListItem[];
  loading?: boolean;
  error?: string | null;
  onProductClick: (productId: string) => void;
  onRetry?: () => void;
}

const ProductGrid = memo(function ProductGrid({
  products,
  loading = false,
  error = null,
  onProductClick,
  onRetry
}: ProductGridProps) {
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load products
        </h3>
        <p className="text-gray-600 text-sm mb-4 max-w-xs">
          {error || 'Something went wrong while loading products. Please try again.'}
        </p>
        {onRetry && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium text-sm active:bg-blue-600 transition-colors"
          >
            Try Again
          </motion.button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-600 text-sm max-w-xs">
          We couldn&apos;t find any products matching your criteria. Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div className="grid grid-cols-2 gap-3 p-4 pb-safe-bottom">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: index * 0.05, // Stagger animation
            ease: [0.25, 0.46, 0.45, 0.94] // iOS-style easing
          }}
        >
          <ProductCard
            product={product}
            onProductClick={onProductClick}
          />
        </motion.div>
      ))}
    </div>
  );
});

export default ProductGrid;