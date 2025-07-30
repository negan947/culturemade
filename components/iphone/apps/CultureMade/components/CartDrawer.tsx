/**
 * CartDrawer Component - iOS-style bottom sheet cart interface
 * Displays cart items with quantity controls and checkout functionality
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useCart } from '@/hooks/useCart';
import { getCartSessionId } from '@/utils/cartSync';

import ProductImage from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function CartDrawer({ isOpen, onClose, userId }: CartDrawerProps) {
  const sessionId = !userId ? getCartSessionId() : undefined;
  const {
    items,
    summary,
    isLoading,
    error,
    isEmpty,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  } = useCart({ userId, sessionId });

  const [removingItem, setRemovingItem] = useState<string | null>(null);

  // Refresh cart when drawer opens
  useEffect(() => {
    if (isOpen) {
      refreshCart();
    }
  }, [isOpen, refreshCart]);

  const handleQuantityUpdate = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setRemovingItem(cartItemId);
      const success = await removeItem(cartItemId);
      setRemovingItem(null);
      return success;
    }
    return await updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setRemovingItem(cartItemId);
    await removeItem(cartItemId);
    setRemovingItem(null);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-50 max-h-[80vh] rounded-t-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Shopping Cart
                </h2>
                {!isEmpty && (
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                    {summary?.itemCount || 0}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!isEmpty && (
                  <button
                    onClick={handleClearCart}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Clear cart"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col max-h-[calc(80vh-120px)]">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-red-600 text-center">
                    <p className="font-medium">Failed to load cart</p>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                    <button
                      onClick={refreshCart}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                  <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Add some items to get started shopping
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <ProductImage
                            src={item.image_url}
                            alt={item.image_alt || item.product_name}
                            productName={item.product_name}
                            className="w-16 h-16 rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.product_name}
                          </h4>
                          {item.variant_title && (
                            <p className="text-sm text-gray-600 truncate">
                              {item.variant_title}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-semibold text-blue-600">
                              {formatPrice(item.price)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Total: {formatPrice(item.total)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                            disabled={removingItem === item.id}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <span className="w-8 text-center font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                            disabled={removingItem === item.id}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItem === item.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          aria-label={`Remove ${item.product_name} from cart`}
                        >
                          {removingItem === item.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cart Summary & Checkout */}
                  {summary && (
                    <div className="border-t border-gray-200 p-4 bg-white">
                      {/* Summary Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatPrice(summary.subtotal)}</span>
                        </div>
                        
                        {summary.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium">{formatPrice(summary.tax)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Shipping
                            {summary.shipping === 0 && (
                              <span className="text-green-600 ml-1">(Free)</span>
                            )}
                          </span>
                          <span className="font-medium">
                            {summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)}
                          </span>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="font-bold text-lg text-blue-600">
                              {formatPrice(summary.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <button
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
                        onClick={() => {
                          // TODO: Navigate to checkout
                          console.log('Navigate to checkout');
                        }}
                      >
                        Proceed to Checkout
                      </button>

                      {/* Continue Shopping */}
                      <button
                        onClick={onClose}
                        className="w-full mt-2 text-blue-600 py-2 px-4 font-medium hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}