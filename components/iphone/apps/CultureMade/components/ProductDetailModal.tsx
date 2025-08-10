'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';

import { ProductListItem } from '@/types/api';
import { trackProductDetailView } from '@/utils/analyticsUtils';
import { calculateInventoryStatus, getStockLevelText } from '@/utils/inventoryUtils';
import { calculatePricingInfo } from '@/utils/pricingUtils';

import ProductImageGallery from './ProductImageGallery';
import ProductInfoSection from './ProductInfoSection';

interface ProductDetailModalProps {
  product: ProductListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
}

const ProductDetailModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}: ProductDetailModalProps) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  // Track product detail view when modal opens
  useEffect(() => {
    if (isOpen && product) {
      trackProductDetailView(product.id, 'product_card', {
        categoryId: product.categories[0]?.id || 'unknown',
        additionalData: {
          category: product.categories[0]?.name || 'unknown',
          price: parseFloat(product.price)
        }
      });
    }
  }, [isOpen, product]);

  // Handle escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
    
    return () => {
      // Cleanup function for when isOpen is false
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Calculate product info if available
  const pricingInfo = product ? calculatePricingInfo(product) : null;
  const inventoryStatus = product ? calculateInventoryStatus(product) : null;

  // Handle add to cart with success feedback
  const handleAddToCartClick = async () => {
    if (!product || isAddingToCart) return;

    setIsAddingToCart(true);
    setAddToCartSuccess(false);

    try {
      await onAddToCart(product.id, undefined, 1);
      setAddToCartSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setAddToCartSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 400,
              duration: 0.4 
            }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h2>
                  {product.categories && product.categories.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {product.categories[0]?.name}
                    </p>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Product Image Gallery */}
              <div className="w-full">
                <ProductImageGallery
                  images={product.primary_image ? [product.primary_image] : []}
                  productName={product.name}
                  className="w-full"
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <ProductInfoSection
                  product={product}
                  pricingInfo={pricingInfo}
                  inventoryStatus={inventoryStatus as any}
                  className="mb-6"
                />

                {/* Add to Cart Button */}
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCartClick}
                    disabled={isAddingToCart || !inventoryStatus?.isAvailable}
                    className={`
                      w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg
                      transition-all duration-200 flex items-center justify-center gap-2
                      ${addToCartSuccess
                        ? 'bg-green-500 text-white'
                        : inventoryStatus?.isAvailable
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </div>
                    ) : addToCartSuccess ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Added to Cart!
                      </div>
                    ) : !inventoryStatus?.isAvailable ? (
                      'Out of Stock'
                    ) : (
                      `Add to Cart • ${pricingInfo?.displayPrice || 'Price not available'}`
                    )}
                  </motion.button>

                  {inventoryStatus?.stockLevel && (
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {getStockLevelText(inventoryStatus)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
