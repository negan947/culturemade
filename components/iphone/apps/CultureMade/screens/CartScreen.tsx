'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';

import { useCart } from '@/hooks/useCart';
import { getCartSessionId } from '@/utils/cartSync';
import { prepareForCheckout, getCheckoutStatusMessage } from '@/utils/checkoutUtils';

import { DragScrollContainer, CartItem } from '../components';

export default function CartScreen() {
  // TODO: Get userId from auth context when available
  const userId = undefined;
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

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [refreshCart]);

  const handleQuantityUpdate = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      return await removeItem(cartItemId);
    }
    return await updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    return await removeItem(cartItemId);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full bg-gray-50">
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-gray-50">
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="font-medium">Failed to load cart</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={refreshCart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        {/* Empty Cart */}
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cart Management</h1>
            <p className="text-sm text-gray-500">Review and edit your items</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">
              {summary?.itemCount || 0} items
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <DragScrollContainer className="flex-1 overflow-y-auto culturemade-scrollable">
        <div className="px-4 py-4 space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <CartItem
                item={item}
                onQuantityUpdate={handleQuantityUpdate}
                onRemove={handleRemoveItem}
                size="lg"
                className="border-none bg-transparent"
              />
            </motion.div>
          ))}
        </div>
      </DragScrollContainer>

      {/* Cart Summary */}
      {summary && (
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatPrice(summary.subtotal)}</span>
            </div>
            
            {summary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{formatPrice(summary.tax)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Shipping
                {summary.shipping === 0 && (
                  <span className="text-green-600 ml-1">(Free)</span>
                )}
              </span>
              <span className="text-gray-900">
                {summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {formatPrice(summary.total)}
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
            onClick={async () => {
              try {
                // Validate cart before proceeding to checkout
                const checkoutPrep = await prepareForCheckout({
                  userId,
                  sessionId,
                  autoResolveConflicts: true,
                  removeUnavailable: true
                });

                const statusMessage = getCheckoutStatusMessage(checkoutPrep.validationResult);

                if (checkoutPrep.canProceed) {
                  console.log('✅ Cart validated successfully:', statusMessage.message);
                  
                  if (checkoutPrep.actions.length > 0) {
                    console.log('🔧 Actions taken:', checkoutPrep.actions);
                  }

                  // TODO: Navigate to Phase 2 checkout page
                  alert(`${statusMessage.title}\n\n${statusMessage.message}\n\nCheckout functionality will be implemented in Phase 2.`);
                } else {
                  console.error('❌ Cart validation failed:', checkoutPrep.validationResult.errors);
                  
                  const errorMessage = checkoutPrep.validationResult.errors.join('\n• ');
                  alert(`${statusMessage.title}\n\n• ${errorMessage}\n\nPlease fix these issues and try again.`);
                }
              } catch (error) {
                console.error('Checkout preparation failed:', error);
                alert('Failed to prepare checkout. Please try again.');
              }
            }}
          >
            Complete Order • {formatPrice(summary.total)}
          </motion.button>

          {summary.shipping > 0 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Free shipping on orders over $75
            </p>
          )}
        </div>
      )}
    </div>
  );
}