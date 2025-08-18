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
  } = useCart({ 
    ...(userId && { userId }),
    ...(sessionId && { sessionId })
  });

  const [removingItem, setRemovingItem] = useState<string | null>(null);

  // Refresh cart when drawer opens and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      refreshCart();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Prevent scroll wheel and keyboard scrolling
      const preventScroll = (e: WheelEvent | KeyboardEvent) => {
        if (e instanceof KeyboardEvent) {
          // Prevent arrow keys, page up/down, space, home, end
          if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
          }
        } else {
          // Prevent scroll wheel
          e.preventDefault();
        }
      };

      // Add event listeners
      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('keydown', preventScroll, { passive: false });

      return () => {
        // Cleanup event listeners
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('keydown', preventScroll);
      };
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
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
            className="absolute bottom-0 left-0 right-0 bg-admin-bg-surface z-50 max-h-[80vh] rounded-t-3xl shadow-admin-popover overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-admin-border">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6 text-admin-accent" />
                <h2 className="text-lg font-semibold text-admin-text-primary">
                  Shopping Cart
                </h2>
                {!isEmpty && (
                  <span className="bg-admin-accent/10 text-admin-accent text-sm font-medium px-2 py-1 rounded-full">
                    {summary?.itemCount || 0}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!isEmpty && (
                  <button
                    onClick={handleClearCart}
                    className="p-2 text-admin-text-secondary hover:text-admin-error hover:bg-admin-error/10 rounded-full transition-colors"
                    aria-label="Clear cart"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg-hover rounded-full transition-colors"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                  <div className="text-admin-error text-center">
                    <p className="font-medium">Failed to load cart</p>
                    <p className="text-sm text-admin-text-secondary mt-1">{error}</p>
                    <button
                      onClick={refreshCart}
                      className="mt-3 px-4 py-2 bg-admin-accent text-white rounded-lg text-sm hover:bg-admin-accent-hover transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                  <ShoppingBag className="h-16 w-16 text-admin-text-disabled mb-4" />
                  <h3 className="text-lg font-medium text-admin-text-primary mb-2">Your cart is empty</h3>
                  <p className="text-admin-text-secondary text-center mb-6">
                    Add some items to get started shopping
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-admin-accent text-white rounded-lg font-medium hover:bg-admin-accent-hover transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items - Using CartItem Component */}
                  <div className="flex-1 overflow-y-auto culturemade-scrollable p-4 space-y-3">
                    {items.map((item) => {
                      // Transform CartItem to CartItemData format
                      const transformedItem = {
                        id: item.id,
                        product_name: item.product_name || 'Unknown Product',
                        ...(item.variant_name && { variant_title: item.variant_name }),
                        price: parseFloat(item.variant_price?.toString() || '0'),
                        quantity: item.quantity,
                        total: parseFloat(item.variant_price?.toString() || '0') * item.quantity,
                        ...(item.product_image && { image_url: item.product_image }),
                        is_available: true
                      };
                      
                      return (
                        <CartItem
                          key={item.id}
                          item={transformedItem}
                          onQuantityUpdate={handleQuantityUpdate}
                          onRemove={handleRemoveItem}
                          isRemoving={removingItem === item.id}
                          size="md"
                        />
                      );
                    })}
                  </div>

                  {/* Cart Summary & Checkout */}
                  {summary && (
                    <div className="border-t border-admin-border p-4 bg-admin-bg-surface">
                      {/* Summary Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-admin-text-secondary">Subtotal</span>
                          <span className="font-medium">{formatPrice(summary.subtotal)}</span>
                        </div>
                        
                        {summary.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-admin-text-secondary">Tax</span>
                            <span className="font-medium">{formatPrice(summary.tax)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-admin-text-secondary">
                            Shipping
                            {summary.shipping === 0 && (
                              <span className="text-admin-success ml-1">(Free)</span>
                            )}
                          </span>
                          <span className="font-medium">
                            {summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)}
                          </span>
                        </div>
                        
                        <div className="border-t border-admin-border pt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-admin-text-primary">Total</span>
                            <span className="font-bold text-lg text-admin-accent">
                              {formatPrice(summary.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Checkout - Primary Action */}
                      <button
                        className="w-full bg-gradient-to-r from-admin-accent to-admin-accent-hover text-white py-4 px-4 rounded-xl font-bold text-lg shadow-admin-soft hover:from-admin-accent-hover hover:to-admin-accent-subtle active:scale-98 transition-all duration-200"
                        onClick={onCheckout}
                      >
                        Checkout • {formatPrice(summary.total)}
                      </button>

                      {/* Continue Shopping */}
                      <button
                        onClick={onClose}
                        className="w-full mt-3 text-admin-text-secondary py-2.5 px-4 font-medium hover:bg-admin-bg-hover rounded-lg transition-colors text-sm"
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