/**
 * CartDrawer Component - iOS-style bottom sheet cart interface
 * Displays cart items with quantity controls and checkout functionality
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useCart } from '@/hooks/useCart';
import { getCartSessionId } from '@/utils/cartSync';

import CartItem from './CartItem';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckout?: () => void;
}

export function CartDrawer({ isOpen, onClose, userId, onCheckout }: CartDrawerProps) {
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
            className="absolute inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 400,
              duration: 0.4
            }}
            className="absolute bottom-0 left-0 right-0 bg-white z-50 max-h-[80vh] rounded-t-3xl shadow-2xl overflow-hidden"
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
                  {/* Cart Items - Using CartItem Component */}
                  <div className="flex-1 overflow-y-auto culturemade-scrollable p-4 space-y-3">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onQuantityUpdate={handleQuantityUpdate}
                        onRemove={handleRemoveItem}
                        isRemoving={removingItem === item.id}
                        size="md"
                      />
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

                      {/* Checkout - Primary Action */}
                      <button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-4 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-98 transition-all duration-200"
                        onClick={onCheckout}
                      >
                        Checkout • {formatPrice(summary.total)}
                      </button>

                      {/* Continue Shopping */}
                      <button
                        onClick={onClose}
                        className="w-full mt-3 text-gray-600 py-2.5 px-4 font-medium hover:bg-gray-50 rounded-lg transition-colors text-sm"
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