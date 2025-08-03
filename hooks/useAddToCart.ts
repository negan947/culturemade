import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { 
  addToCart,
  updateQuantity,
  removeItem,
  loadCart,
  clearCartAsync,
  setCartId,
  clearError,
  clearLastAddedItem,
  optimisticAddItem,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  rollbackOptimisticUpdate
} from '@/store/cart-slice';
import { notificationActions } from '@/store/notification-slice';
import { AppDispatch, RootState } from '@/store/store';
import { AddToCartRequest, CartItem } from '@/utils/cartUtils';
import { validateQuantity } from '@/utils/quantityUtils';

export interface UseAddToCartResult {
  // Cart state
  cart: ReturnType<typeof useSelector<RootState, RootState['cart']>>;
  
  // Actions
  addToCart: (request: Omit<AddToCartRequest, 'userId' | 'sessionId'>) => Promise<boolean>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeCartItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  
  // Validation
  validateAddToCart: (productId: string, variantId: string, quantity: number) => Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  // Utilities
  isLoading: boolean;
  error: string | null;
  lastAddedItem: CartItem | null;
  clearError: () => void;
  clearLastAdded: () => void;
}

export interface UseAddToCartOptions {
  userId?: string | undefined;
  sessionId?: string | undefined;
  enableOptimisticUpdates?: boolean;
  showNotifications?: boolean;
  autoRefreshOnMount?: boolean;
  onSuccess?: (action: 'add' | 'update' | 'remove' | 'clear', item?: CartItem) => void;
  onError?: (error: string, action: 'add' | 'update' | 'remove' | 'clear') => void;
}

export function useAddToCart(options: UseAddToCartOptions = {}): UseAddToCartResult {
  const {
    userId,
    sessionId,
    enableOptimisticUpdates = true,
    showNotifications = true,
    autoRefreshOnMount = true,
    onSuccess,
    onError
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set cart ID on mount or when userId/sessionId changes
  useEffect(() => {
    if (userId || sessionId) {
      dispatch(setCartId({ userId, sessionId }));
    }
  }, [dispatch, userId, sessionId]);

  // Auto-refresh cart on mount
  useEffect(() => {
    if (autoRefreshOnMount && (userId || sessionId)) {
      dispatch(loadCart());
    }
  }, [dispatch, userId, sessionId, autoRefreshOnMount]);

  // Validate add to cart request
  const validateAddToCart = useCallback(async (
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    if (!productId) {
      errors.push('Product ID is required');
    }

    if (!variantId) {
      errors.push('Please select a variant');
    }

    if (quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    try {
      const quantityValidation = await validateQuantity(variantId, quantity);
      return {
        isValid: quantityValidation.isValid,
        errors: quantityValidation.errors
      };
    } catch {
      return {
        isValid: false,
        errors: ['Unable to validate product availability']
      };
    }
  }, []);

  // Add item to cart
  const addToCartAction = useCallback(async (
    request: Omit<AddToCartRequest, 'userId' | 'sessionId'>
  ): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      // Validate request
      const validation = await validateAddToCart(
        request.productId,
        request.variantId,
        request.quantity
      );

      if (!validation.isValid) {
        const errorMessage = validation.errors[0] || 'Invalid request';
        
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Cannot Add to Cart',
            message: errorMessage,
            icon: 'error'
          }));
        }
        
        onError?.(errorMessage, 'add');
        return false;
      }

      // Optimistic update
      if (enableOptimisticUpdates) {
        dispatch(optimisticAddItem({
          id: `temp-${Date.now()}`,
          product_id: request.productId,
          variant_id: request.variantId,
          quantity: request.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      // Dispatch actual add to cart
      const result = await dispatch(addToCart({
        ...request,
        userId: userId || '',
        sessionId: sessionId || ''
      }));

      if (addToCart.fulfilled.match(result)) {
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Added to Cart',
            message: 'Item successfully added to your cart',
            icon: 'success'
          }));
        }
        
        onSuccess?.('add', result.payload?.cartItem);
        return true;
      } else {
        // Rollback optimistic update
        if (enableOptimisticUpdates && cart.summary) {
          dispatch(rollbackOptimisticUpdate({ originalState: cart }));
        }
        
        const errorMessage = (result.payload as string) || 'Failed to add item to cart';
        
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Add to Cart Failed',
            message: errorMessage,
            icon: 'error'
          }));
        }
        
        onError?.(errorMessage, 'add');
        return false;
      }

    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && cart.summary) {
        dispatch(rollbackOptimisticUpdate({ originalState: cart }));
      }
      
      const errorMessage = 'An unexpected error occurred';
      
      if (showNotifications) {
        dispatch(notificationActions.new({
          title: 'Add to Cart Failed',
          message: errorMessage,
          icon: 'error'
        }));
      }
      
      onError?.(errorMessage, 'add');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [
    dispatch,
    userId,
    sessionId,
    enableOptimisticUpdates,
    showNotifications,
    onSuccess,
    onError,
    validateAddToCart,
    cart.summary
  ]);

  // Update item quantity
  const updateItemQuantity = useCallback(async (
    cartItemId: string,
    quantity: number
  ): Promise<boolean> => {
    setIsProcessing(true);

    try {
      // Optimistic update
      if (enableOptimisticUpdates) {
        dispatch(optimisticUpdateQuantity({ cartItemId, quantity }));
      }

      const result = await dispatch(updateQuantity({
        cartItemId,
        quantity
      }));

      if (updateQuantity.fulfilled.match(result)) {
        if (showNotifications && quantity === 0) {
          dispatch(notificationActions.new({
            title: 'Item Removed',
            message: 'Item removed from your cart',
            icon: 'success'
          }));
        }
        
        onSuccess?.('update');
        return true;
      } else {
        // Rollback optimistic update
        if (enableOptimisticUpdates && cart.summary) {
          dispatch(rollbackOptimisticUpdate({ originalState: cart }));
        }
        
        const errorMessage = result.payload || 'Failed to update quantity';
        
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Update Failed',
            message: errorMessage,
            icon: 'error'
          }));
        }
        
        onError?.(errorMessage, 'update');
        return false;
      }

    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && cart.summary) {
        dispatch(rollbackOptimisticUpdate({ originalState: cart }));
      }
      
      const errorMessage = 'Failed to update quantity';
      
      if (showNotifications) {
        dispatch(notificationActions.new({
          title: 'Update Failed',
          message: errorMessage,
          icon: 'error'
        }));
      }
      
      onError?.(errorMessage, 'update');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [
    dispatch,
    userId,
    sessionId,
    enableOptimisticUpdates,
    showNotifications,
    onSuccess,
    onError,
    cart.summary
  ]);

  // Remove item from cart
  const removeCartItem = useCallback(async (cartItemId: string): Promise<boolean> => {
    setIsProcessing(true);

    try {
      // Optimistic update
      if (enableOptimisticUpdates) {
        dispatch(optimisticRemoveItem({ cartItemId }));
      }

      const result = await dispatch(removeItem({
        cartItemId
      }));

      if (removeItem.fulfilled.match(result)) {
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Item Removed',
            message: 'Item removed from your cart',
            icon: 'success'
          }));
        }
        
        onSuccess?.('remove');
        return true;
      } else {
        // Rollback optimistic update
        if (enableOptimisticUpdates && cart.summary) {
          dispatch(rollbackOptimisticUpdate({ originalState: cart }));
        }
        
        const errorMessage = result.payload || 'Failed to remove item';
        
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Remove Failed',
            message: errorMessage,
            icon: 'error'
          }));
        }
        
        onError?.(errorMessage, 'remove');
        return false;
      }

    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && cart.summary) {
        dispatch(rollbackOptimisticUpdate({ originalState: cart }));
      }
      
      const errorMessage = 'Failed to remove item';
      
      if (showNotifications) {
        dispatch(notificationActions.new({
          title: 'Remove Failed',
          message: errorMessage,
          icon: 'error'
        }));
      }
      
      onError?.(errorMessage, 'remove');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [
    dispatch,
    userId,
    sessionId,
    enableOptimisticUpdates,
    showNotifications,
    onSuccess,
    onError,
    cart.summary
  ]);

  // Clear cart
  const clearCartAction = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const result = await dispatch(clearCartAsync());

      if (clearCartAsync.fulfilled.match(result)) {
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Cart Cleared',
            message: 'All items removed from your cart',
            icon: 'success'
          }));
        }
        
        onSuccess?.('clear');
        return true;
      } else {
        const errorMessage = result.payload || 'Failed to clear cart';
        
        if (showNotifications) {
          dispatch(notificationActions.new({
            title: 'Clear Failed',
            message: errorMessage,
            icon: 'error'
          }));
        }
        
        onError?.(errorMessage, 'clear');
        return false;
      }

    } catch {
      const errorMessage = 'Failed to clear cart';
      
      if (showNotifications) {
        dispatch(notificationActions.new({
          title: 'Clear Failed',
          message: errorMessage,
          icon: 'error'
        }));
      }
      
      onError?.(errorMessage, 'clear');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, userId, sessionId, showNotifications, onSuccess, onError]);

  // Refresh cart
  const refreshCart = useCallback(async (): Promise<void> => {
    if (userId || sessionId) {
      await dispatch(loadCart());
    }
  }, [dispatch, userId, sessionId]);

  // Clear error
  const clearErrorAction = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear last added item
  const clearLastAdded = useCallback(() => {
    dispatch(clearLastAddedItem());
  }, [dispatch]);

  return {
    // Cart state
    cart,
    
    // Actions
    addToCart: addToCartAction,
    updateItemQuantity,
    removeCartItem,
    clearCart: clearCartAction,
    refreshCart,
    
    // Validation
    validateAddToCart,
    
    // Utilities
    isLoading: cart.isLoading || isProcessing,
    error: cart.error,
    lastAddedItem: cart.lastAddedItem,
    clearError: clearErrorAction,
    clearLastAdded
  };
}

/**
 * Simplified hook for basic add to cart functionality
 */
export function useSimpleAddToCart(userId?: string, sessionId?: string) {
  const result = useAddToCart({
    userId,
    sessionId,
    enableOptimisticUpdates: true,
    showNotifications: true,
    autoRefreshOnMount: true
  });

  return {
    addToCart: result.addToCart,
    itemCount: result.cart.itemCount,
    isLoading: result.isLoading,
    error: result.error
  };
}

/**
 * Hook for cart quantity management
 */
export function useCartQuantity(userId?: string, sessionId?: string) {
  const { updateItemQuantity, removeCartItem, cart, isLoading } = useAddToCart({
    userId,
    sessionId,
    enableOptimisticUpdates: true,
    showNotifications: false
  });

  const incrementItem = useCallback(async (cartItemId: string) => {
    const item = cart.items.find(item => item.id === cartItemId);
    if (item) {
      return await updateItemQuantity(cartItemId, item.quantity + 1);
    }
    return false;
  }, [cart.items, updateItemQuantity]);

  const decrementItem = useCallback(async (cartItemId: string) => {
    const item = cart.items.find(item => item.id === cartItemId);
    if (item) {
      if (item.quantity <= 1) {
        return await removeCartItem(cartItemId);
      } else {
        return await updateItemQuantity(cartItemId, item.quantity - 1);
      }
    }
    return false;
  }, [cart.items, updateItemQuantity, removeCartItem]);

  return {
    incrementItem,
    decrementItem,
    updateItemQuantity,
    removeCartItem,
    isLoading
  };
}