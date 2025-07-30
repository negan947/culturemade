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
      trackProductDetailView(product.id, {
        source: 'product_card',
        category: product.categories[0]?.name || 'unknown',
        price: parseFloat(product.price)
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
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-50 backdrop-blur-md flex items-start justify-center pt-8 pb-16 px-4 overflow-hidden"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          aria-describedby="product-modal-description"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.3
            }}
            className="w-full max-w-sm max-h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
              <h2 
                id="product-modal-title"
                className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4"
              >
                {product.name}
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                aria-label="Close product details"
                style={{ minWidth: '44px', minHeight: '44px' }} // iOS touch target
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Modal Content - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto"
              id="product-modal-description"
            >
              {/* Image Gallery Section */}
              <div className="relative">
                <ProductImageGallery
                  images={product.primary_image ? [product.primary_image] : []}
                  productName={product.name}
                />
              </div>

              {/* Product Information Section */}
              <div className="px-4 pb-6">
                <ProductInfoSection
                  product={product}
                  pricingInfo={pricingInfo}
                  inventoryStatus={inventoryStatus}
                />
              </div>

              {/* Add to Cart Section */}
              <div className="px-4 pb-4 border-t border-gray-100 mt-auto">
                <div className="py-4">
                  {/* Price Display */}
                  {pricingInfo && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {pricingInfo.displayPrice}
                      </div>
                      {pricingInfo.originalPrice && pricingInfo.originalPrice !== pricingInfo.displayPrice && (
                        <div className="text-lg text-gray-500 line-through">
                          {pricingInfo.originalPrice}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Stock Status */}
                  {inventoryStatus && (
                    <div className="mb-4">
                      <div className={`text-sm font-medium ${
                        inventoryStatus.status === 'in_stock' 
                          ? 'text-green-600' 
                          : inventoryStatus.status === 'low_stock'
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {getStockLevelText(inventoryStatus)}
                      </div>
                    </div>
                  )}
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCartClick}
                    disabled={inventoryStatus?.status === 'out_of_stock' || isAddingToCart}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      inventoryStatus?.status === 'out_of_stock' || isAddingToCart
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addToCartSuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : addToCartSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added to Cart!
                      </>
                    ) : inventoryStatus?.status === 'out_of_stock' ? (
                      'Out of Stock'
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
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