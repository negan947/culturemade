'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, Share, Star } from 'lucide-react';
import { useEffect, memo } from 'react';

import { useInventoryStatus } from '@/hooks/useInventoryStatus';
import { useProductInteraction } from '@/hooks/useProductInteraction';
import { useProductPricing } from '@/hooks/useProductPricing';
import { ProductListItem } from '@/types/api';

import ProductImage from './ProductImage';

interface ModalProductCardProps {
  product: ProductListItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: ((productId: string, variantId?: string, quantity?: number) => Promise<void>) | undefined;
  onProductClick?: ((productId: string) => void) | undefined;
}

const ModalProductCard = memo(function ModalProductCard({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  onProductClick
}: ModalProductCardProps) {
  // Use advanced hooks for comprehensive product data
  const { pricing, priceText, originalPriceText, isOnSale, discountText, savingsText } = useProductPricing(product);
  
  const { 
    inventory, 
    badge, 
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
    sourceComponent: 'modal_product_card',
    positionIndex: 0,
    enableAnalytics: true,
    enableHapticFeedback: true
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    return undefined;
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isOpen, onClose]);

  // Enhanced click handler with analytics
  const handleAddToCart = async () => {
    if (!onAddToCart || isOutOfStock || isProcessing) return;

    try {
      await handleInteractionClick(product.id, { 
        clickTarget: 'add_to_cart_modal',
        additionalData: { 
          productName: product.name,
          price: pricing.displayPrice,
          category: product.categories?.[0]?.name,
          modalContext: true
        }
      });
      
      await onAddToCart(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleProductView = () => {
    if (onProductClick) {
      handleInteractionClick(product.id, { 
        clickTarget: 'view_product_modal',
        additionalData: { 
          productName: product.name,
          modalContext: true
        }
      });
      onProductClick(product.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${product.id}`}
          aria-describedby={`modal-description-${product.id}`}
        >
          {/* Animated Blurred Background Backdrop */}
          <motion.div 
            initial={{ 
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(0,0,0,0)"
            }}
            animate={{ 
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(0,0,0,0.4)"
            }}
            exit={{ 
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(0,0,0,0)"
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            aria-hidden="true"
          />
          
          {/* Modal Content with Spring Animation */}
          <motion.div
            ref={impressionRef}
            initial={{ 
              scale: 0.8, 
              opacity: 0, 
              y: 50,
              rotateX: 10
            }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              rotateX: 0
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0, 
              y: 50,
              rotateX: 10
            }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8
            }}
            className="relative bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/20 to-transparent">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                aria-label="Close product details"
              >
                <X className="w-5 h-5 text-gray-700" />
              </motion.button>
              
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                  aria-label="Add to favorites"
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                  aria-label="Share product"
                >
                  <Share className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>
            </div>
            
            {/* Product Image with Overlay Effects */}
            <div className="relative aspect-square">
              <ProductImage
                src={product.primary_image?.url || null}
                alt={product.primary_image?.alt_text || `${product.name} product image`}
                productName={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Sale Badge */}
              {badge && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute top-4 left-4"
                >
                  <div 
                    className={`${badge.bgColor} ${badge.textColor} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}
                    role="status"
                    aria-label={`Product status: ${badge.text}`}
                  >
                    <Star className="w-3 h-3" aria-hidden="true" />
                    {badge.text}
                  </div>
                </motion.div>
              )}
              
              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
                  role="status"
                  aria-label="Product is out of stock"
                >
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold shadow-lg">
                    Out of Stock
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Product Details with Staggered Animation */}
            <motion.div 
              className="p-6 space-y-4 overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Product Title */}
              <div>
                <h2 
                  id={`modal-title-${product.id}`}
                  className="text-xl font-bold text-gray-900 leading-tight"
                >
                  {product.name}
                </h2>
                
                {/* Categories */}
                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories.slice(0, 2).map((category) => (
                      <span
                        key={category.id}
                        className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Pricing Section */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {priceText}
                  </span>
                  {isOnSale && originalPriceText && (
                    <span className="text-lg text-gray-400 line-through">
                      {originalPriceText}
                    </span>
                  )}
                </div>
                
                {isOnSale && (discountText || savingsText) && (
                  <div className="flex gap-2">
                    {discountText && (
                      <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                        {discountText}
                      </span>
                    )}
                    {savingsText && (
                      <span className="text-sm font-medium text-green-600">
                        {savingsText}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
              
              {/* Stock Status */}
              {showStockWarning && (
                <motion.div 
                  className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  role="status"
                  aria-label={`Inventory status: ${stockText}`}
                >
                  ⚠️ {stockText}
                </motion.div>
              )}
              
              {/* Product Description */}
              {product.description && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-semibold text-gray-900">Description</h3>
                  <p 
                    id={`modal-description-${product.id}`}
                    className="text-gray-600 text-sm leading-relaxed line-clamp-4"
                  >
                    {product.description}
                  </p>
                </motion.div>
              )}
              
              {/* Action Buttons */}
              <motion.div 
                className="flex gap-3 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Add to Cart Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isProcessing}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isOutOfStock || isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  }`}
                  aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isOutOfStock ? 'Out of Stock' : isProcessing ? 'Adding...' : 'Add to Cart'}
                </motion.button>
                
                {/* View Details Button */}
                {onProductClick && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProductView}
                    className="px-6 py-4 rounded-xl font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                    aria-label={`View full details for ${product.name}`}
                  >
                    Details
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ModalProductCard;