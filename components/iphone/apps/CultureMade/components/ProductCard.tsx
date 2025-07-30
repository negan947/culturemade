'use client';

import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { memo } from 'react';

import { ProductListItem } from '@/types/api';

import ProductImage from './ProductImage';


interface ProductCardProps {
  product: ProductListItem;
  onProductClick: (productId: string) => void;
  className?: string;
  loading?: boolean;
}

const ProductCard = memo(function ProductCard({ product, onProductClick, className, loading }: ProductCardProps) {
  // Calculate if product is on sale
  const isOnSale = product.compare_at_price && 
    parseFloat(product.compare_at_price) > parseFloat(product.price);
  
  // Calculate discount percentage
  const discountPercentage = isOnSale
    ? Math.round(((parseFloat(product.compare_at_price!) - parseFloat(product.price)) / parseFloat(product.compare_at_price!)) * 100)
    : 0;

  // Determine if product is out of stock
  const isOutOfStock = product.total_inventory <= 0;
  
  // Determine if product is low stock
  const isLowStock = product.total_inventory > 0 && product.total_inventory <= 5;

  // Format pricing display
  const priceDisplay = product.min_price !== product.max_price 
    ? `from $${product.min_price}`
    : `$${product.price}`;

  // Handle click event
  const handleClick = () => {
    if (!loading && !isOutOfStock) {
      onProductClick(product.id);
    }
  };

  // Generate comprehensive accessibility label
  const accessibilityLabel = `Product card for ${product.name}, priced at ${priceDisplay}${
    isOutOfStock ? ', out of stock' : ''
  }${isOnSale ? `, on sale with ${discountPercentage}% off` : ''}${
    isLowStock && !isOutOfStock ? `, low stock with only ${product.total_inventory} remaining` : ''
  }${product.featured ? ', featured product' : ''}`;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={handleClick}
      className={`bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 active:shadow-md transition-shadow ${
        isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${loading ? 'pointer-events-none' : ''} ${className || ''}`}
      role="button"
      tabIndex={0}
      aria-label={accessibilityLabel}
      aria-describedby={`product-${product.id}-details`}
      aria-disabled={isOutOfStock || loading}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Product Image with Overlays */}
      <div className="relative">
        <ProductImage
          src={product.primary_image?.url || null}
          alt={product.primary_image?.alt_text || `${product.name} product image`}
          productName={product.name}
          className="rounded-t-lg"
        />

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1" aria-label="Product status badges">
          {isOnSale && (
            <div 
              className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
              role="status"
              aria-label={`On sale: ${discountPercentage}% off`}
            >
              <Tag className="w-3 h-3" aria-hidden="true" />
              {discountPercentage}% OFF
            </div>
          )}
          {product.featured && !isOnSale && (
            <div 
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold"
              role="status"
              aria-label="Featured product"
            >
              Featured
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div 
              className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold"
              role="status"
              aria-label={`Low stock: only ${product.total_inventory} remaining`}
            >
              Low Stock
            </div>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            role="status"
            aria-label="Product is out of stock"
          >
            <div className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-semibold">
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3" id={`product-${product.id}-details`}>
        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        
        {/* Pricing */}
        <div className="flex items-center gap-2 mb-1" role="group" aria-label="Product pricing">
          <span 
            className="text-blue-600 font-semibold text-sm"
            aria-label={`Current price: ${priceDisplay}`}
          >
            {priceDisplay}
          </span>
          {isOnSale && (
            <span 
              className="text-gray-400 text-xs line-through"
              aria-label={`Original price: $${product.compare_at_price}`}
            >
              ${product.compare_at_price}
            </span>
          )}
        </div>

        {/* Categories */}
        {product.categories && product.categories.length > 0 && (
          <div 
            className="flex flex-wrap gap-1"
            role="group" 
            aria-label="Product categories"
          >
            {product.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                role="text"
              >
                {category.name}
              </span>
            ))}
            {product.categories.length > 2 && (
              <span 
                className="text-xs text-gray-400"
                aria-label={`${product.categories.length - 2} more categories`}
              >
                +{product.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Inventory Status */}
        {!isOutOfStock && isLowStock && (
          <div 
            className="text-xs text-orange-600 mt-1 font-medium"
            role="status"
            aria-label={`Low inventory warning: only ${product.total_inventory} items left`}
          >
            Only {product.total_inventory} left
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ProductCard;