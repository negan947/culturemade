'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';

import { useCart } from '@/hooks/useCart';
import { getCartSessionId } from '@/utils/cartSync';
import { prepareForCheckout, getCheckoutStatusMessage } from '@/utils/checkoutUtils';

import { CartItem } from '../components';

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
  } = useCart({ ...(userId ? { userId } : {}), ...(sessionId ? { sessionId } : {}) });

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
    await removeItem(cartItemId);
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
      <div className="h-full bg-gray-900">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-gray-900">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <p className="font-medium">Failed to load cart</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
            <button
              onClick={refreshCart}
              className="px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors"
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
      <div className="h-full bg-gray-900">
        {/* Header */}
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
        </div>

        {/* Empty Cart */}
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <ShoppingBag className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-400 mb-6">Add some products to get started</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-admin-accent text-white px-6 py-3 rounded-lg font-medium"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
            <p className="text-sm text-gray-400">Review and edit your items</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {summary?.itemCount || 0} items
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items - Hybrid: Native mobile + Drag desktop */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain scrollable culturemade-scrollable drag-scroll-container"
        onMouseDown={(e) => {
          // Only enable drag scrolling on desktop (non-touch devices)
          if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
          
          const container = e.currentTarget;
          let isScrolling = false;
          const startY = e.pageY;
          const startScrollTop = container.scrollTop;

          const handleMouseMove = (e: MouseEvent) => {
            if (!isScrolling) return;
            e.preventDefault();
            const deltaY = e.pageY - startY;
            container.scrollTop = startScrollTop - deltaY;
          };

          const handleMouseUp = () => {
            isScrolling = false;
            container.style.cursor = '';
            container.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          // Start drag scrolling
          isScrolling = true;
          container.style.cursor = 'grabbing';
          container.style.userSelect = 'none';
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        style={{ cursor: 'grab' }}
      >
        <div className="px-4 py-4 space-y-4">
          {items.map((item, index) => {
            // Transform cart item to match CartItemData interface
            const itemPrice = parseFloat(item.price?.toString() || '0');
            const itemTotal = parseFloat(item.total?.toString() || '0');
            const cartItemData = {
              id: item.id,
              product_name: item.product_name || 'Unknown Product',
              ...(item.variant_title !== undefined ? { variant_title: item.variant_title } : {}),
              price: itemPrice,
              quantity: item.quantity,
              total: itemTotal,
              ...(item.image_url !== undefined ? { image_url: item.image_url } : {}),
              ...(item.image_alt !== undefined ? { image_alt: item.image_alt } : {}),
              // inventory_quantity omitted since not available
              is_available: true, // Assume available since it's in cart
            };

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg shadow-sm border border-gray-700"
              >
                <CartItem
                  item={cartItemData}
                  onQuantityUpdate={handleQuantityUpdate}
                  onRemove={handleRemoveItem}
                  size="lg"
                  className="border-none bg-transparent"
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cart Summary */}
      {summary && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatPrice(summary.subtotal)}</span>
            </div>
            
            {summary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">{formatPrice(summary.tax)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                Shipping
                {summary.shipping === 0 && (
                  <span className="text-green-600 ml-1">(Free)</span>
                )}
              </span>
              <span className="text-white">
                {summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)}
              </span>
            </div>
            
            <div className="border-t border-gray-700 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="font-semibold text-white text-lg">
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
                  ...(userId ? { userId } : {}),
                  ...(sessionId ? { sessionId } : {}),
                  autoResolveConflicts: true,
                  removeUnavailable: true
                });

                const statusMessage = getCheckoutStatusMessage(checkoutPrep.validationResult);

                if (checkoutPrep.canProceed) {

                  
                  if (checkoutPrep.actions.length > 0) {
                    console.log('🔧 Actions taken:', checkoutPrep.actions);
                  }

                  // TODO: Navigate to Phase 2 checkout page
                  alert(`${statusMessage.title}\n\n${statusMessage.message}\n\nCheckout functionality will be implemented in Phase 2.`);
                } else {

                  
                  const errorMessage = checkoutPrep.validationResult.errors.join('\n• ');
                  alert(`${statusMessage.title}\n\n• ${errorMessage}\n\nPlease fix these issues and try again.`);
                }
              } catch (error) {
                console.error('Checkout validation failed:', error);
                alert('Failed to validate cart. Please try again.');
              }
            }}
          >
            Proceed to Checkout • {formatPrice(summary.total)}
          </motion.button>
        </div>
      )}
    </div>
  );
}
