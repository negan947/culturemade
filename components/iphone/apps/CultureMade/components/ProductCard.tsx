'use client';

import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { memo, useState } from 'react';

import { useInventoryStatus } from '@/hooks/useInventoryStatus';
import { useProductInteraction } from '@/hooks/useProductInteraction';
import { useProductPricing } from '@/hooks/useProductPricing';
import { ProductListItem } from '@/types/api';

import ModalProductCard from './ModalProductCard';
import ProductImage from './ProductImage';


interface ProductCardProps {
  product: ProductListItem;
  onProductClick: (productId: string) => void;
  onAddToCart?: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  className?: string;
  loading?: boolean;
  sourceComponent?: string;
  positionIndex?: number;
}

const ProductCard = memo(function ProductCard({ 
  product, 
  onProductClick, 
  onAddToCart, 
  className, 
  loading,
  sourceComponent = 'product_grid',
  positionIndex 
}: ProductCardProps) {
  // Modal state for popup functionality
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use advanced hooks for business logic
  const { pricing, priceText, originalPriceText, isOnSale, discountText } = useProductPricing(product);
  
  const { 
    inventory, 
    badge, 
    cardClasses, 
    stockText, 
    isAvailable, 
    isLowStock, 
    isOutOfStock, 
    showStockWarning 
  } = useInventoryStatus(product);
  
  const { 
    handleClick: handleInteractionClick, 
    handleImpression,
    impressionRef,
    isProcessing
  } = useProductInteraction({
    sourceComponent,
    positionIndex: positionIndex ?? 0,
    enableAnalytics: true,
    enableHapticFeedback: true
  });

  // Enhanced click handler - now opens modal instead of navigation
  const handleClick = () => {
    if (!loading && !isProcessing) {
      handleInteractionClick(product.id, { 
        clickTarget: 'product_card_trigger',
        additionalData: { 
          productName: product.name,
          price: pricing.displayPrice,
          category: product.categories?.[0]?.name,
          modalTrigger: true
        }
      });
      setIsModalOpen(true);
    }
  };

  // Modal handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Generate comprehensive accessibility label using advanced hook data
  const accessibilityLabel = `Product card for ${product.name}, priced at ${priceText}${
    isOutOfStock ? ', out of stock' : ''
  }${isOnSale ? `, ${discountText}` : ''}${
    showStockWarning ? `, ${stockText}` : ''
  }${product.featured ? ', featured product' : ''}`;

  return (
    <>
      {/* Modal ProductCard */}
      <ModalProductCard
        product={product}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={onAddToCart}
        onProductClick={onProductClick}
      />

      {/* Trigger Card */}
      <motion.div
        ref={impressionRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={handleClick}
        className={`bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-all ${
          cardClasses.cardClasses
        } ${loading || isProcessing ? 'pointer-events-none opacity-60' : ''} ${className || ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${accessibilityLabel}. Click to open product details modal.`}
        aria-describedby={`product-${product.id}-details`}
        aria-disabled={loading || isProcessing}
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

        {/* Status Badges - Using Advanced Badge System */}
        <div className="absolute top-2 left-2 flex flex-col gap-1" aria-label="Product status badges">
          {badge && (
            <div 
              className={`${badge.bgColor} ${badge.textColor} px-2 py-1 rounded text-xs font-semibold flex items-center gap-1`}
              role="status"
              aria-label={`Product status: ${badge.text}`}
            >
              <Tag className="w-3 h-3" aria-hidden="true" />
              {badge.text}
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
        <h3 className="font-medium text-white text-sm mb-1 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        
        {/* Pricing - Using Advanced Pricing System */}
        <div className="flex items-center gap-2 mb-1" role="group" aria-label="Product pricing">
          <span 
            className="text-blue-400 font-semibold text-sm"
            aria-label={`Current price: ${priceText}`}
          >
            {priceText}
          </span>
          {isOnSale && originalPriceText && (
            <span 
              className="text-gray-500 text-xs line-through"
              aria-label={`Original price: ${originalPriceText}`}
            >
              {originalPriceText}
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
                className="text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded"
                role="text"
              >
                {category.name}
              </span>
            ))}
            {product.categories.length > 2 && (
              <span 
                className="text-xs text-gray-500"
                aria-label={`${product.categories.length - 2} more categories`}
              >
                +{product.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Inventory Status - Using Advanced Inventory System */}
        {showStockWarning && (
          <div 
            className="text-xs text-orange-400 mt-1 font-medium"
            role="status"
            aria-label={`Inventory status: ${stockText}`}
          >
            {stockText}
          </div>
        )}
      </div>
      </motion.div>
    </>
  );
});

export default ProductCard;