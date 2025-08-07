'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, Share, Star, ChevronDown } from 'lucide-react';
import { useEffect, memo, useState } from 'react';

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
  // State for nutritional facts section
  const [isNutritionExpanded, setIsNutritionExpanded] = useState(false);

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
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(0,0,0,0.5)"
            }}
            exit={{ 
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(0,0,0,0)"
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 backdrop-blur-md"
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
            className="relative bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Image with Overlay Effects */}
            <div className="relative aspect-square bg-gray-50 rounded-t-2xl flex items-center justify-center">
              {/* Close Button - positioned over image */}
              <div className="absolute top-4 left-4 z-20">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                  aria-label="Close product details"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </motion.button>
              </div>
              {/* Package/Box icon placeholder */}
              <div className="w-20 h-20 text-gray-300 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Option dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
              
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
            </div>
            
            {/* Product Details with Staggered Animation */}
            <motion.div 
              className="p-6 space-y-5 overflow-y-auto flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Product Title */}
              <div>
                <p className="text-gray-500 text-sm mb-1">Thin Choise</p>
                <h2 
                  id={`modal-title-${product.id}`}
                  className="text-2xl font-bold text-gray-900 leading-tight mb-3"
                >
                  {product.name}
                </h2>
                
                {/* Rating Section */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className="w-4 h-4 fill-orange-400 text-orange-400" 
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">110 Reviews</span>
                </div>
              </div>
              

              {/* Pricing Section */}
              <motion.div 
                className="space-y-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-blue-600">
                    {priceText}
                  </span>
                  {isOnSale && originalPriceText && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {originalPriceText}
                      </span>
                      {savingsText && (
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {savingsText}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {isOnSale && discountText && (
                  <div className="text-green-600 text-sm font-medium">
                    You save {discountText}!
                  </div>
                )}
              </motion.div>
              
              {/* Action Buttons */}
              <motion.div 
                className="flex gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Add to Cart Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isProcessing}
                  className="flex-1 py-4 rounded-xl font-semibold bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add To Cart
                </motion.button>
                
                {/* Buy Now Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
                  aria-label={`Buy ${product.name} now`}
                >
                  Buy Now
                </motion.button>
              </motion.div>

              {/* Details Section */}
              <motion.div 
                className="space-y-2 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="font-semibold text-gray-900 text-lg">Details</h3>
                <p 
                  id={`modal-description-${product.id}`}
                  className="text-gray-600 text-sm leading-relaxed"
                >
                  Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam quis risus eget urna mollis ornare vel eu leo.
                </p>
              </motion.div>

              {/* Nutritional Facts Collapsible Section */}
              <motion.div 
                className="border-t border-gray-200 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={() => setIsNutritionExpanded(!isNutritionExpanded)}
                  className="flex items-center justify-between w-full py-2 text-left"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold text-gray-900 text-lg">Nutritional facts</span>
                  <motion.div
                    animate={{ rotate: isNutritionExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {isNutritionExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between">
                          <span>Calories</span>
                          <span>120</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Fat</span>
                          <span>8g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sodium</span>
                          <span>95mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein</span>
                          <span>12g</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ModalProductCard;