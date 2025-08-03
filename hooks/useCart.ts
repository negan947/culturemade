/**
 * useCart Hook - Complete cart state management with API integration
 * Provides cart operations with error handling, optimistic updates, and persistence
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  addToCart as addToCartAction,
  updateQuantity as updateQuantityAction,
  removeItem as removeItemAction,
  loadCart,
  loadItemCount,
  clearCartAsync,
  setCartId,
  clearError,
  clearLastAddedItem,
  optimisticAddItem,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  rollbackOptimisticUpdate
} from '@/store/cart-slice';
import { RootState, AppDispatch } from '@/store/store';
import { AddToCartRequest, CartItem } from '@/utils/cartUtils';

interface UseCartOptions {
  userId?: string | undefined;
  sessionId?: string | undefined;
  enableOptimisticUpdates?: boolean;
  autoRefresh?: boolean;
}

interface UseCartReturn {
  // Cart state
  items: CartItem[];
  summary: any;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  lastAddedItem: CartItem | null;
  
  // Computed values
  isEmpty: boolean;
  hasItems: boolean;
  subtotal: number;
  total: number;
  hasLowStockItems: boolean;
  hasOutOfStockItems: boolean;
  
  // Actions
  addToCart: (request: Omit<AddToCartRequest, 'userId' | 'sessionId'>) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  refreshItemCount: () => Promise<void>;
  
  // State management
  clearError: () => void;
  clearLastAddedItem: () => void;
  
  // Item utilities
  getItemById: (cartItemId: string) => CartItem | undefined;
  getItemByVariant: (variantId: string) => CartItem | undefined;
  getItemQuantity: (variantId: string) => number;
  canAddMore: (variantId: string, maxStock?: number) => boolean;
}

/**
 * Custom hook for cart state management
 */
export function useCart(options: UseCartOptions = {}): UseCartReturn {
  const {
    userId,
    sessionId,
    enableOptimisticUpdates = true,
    autoRefresh = true
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const cartState = useSelector((state: RootState) => state.cart);

  // Set cart identification on mount or when IDs change
  useEffect(() => {
    if (userId || sessionId) {
      dispatch(setCartId({ userId, sessionId }));
    }
  }, [dispatch, userId, sessionId]);

  // Auto-refresh cart on mount and when IDs change
  useEffect(() => {
    if (autoRefresh && (userId || sessionId)) {
      refreshCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionId, autoRefresh]);

  // Computed values
  const computed = useMemo(() => ({
    isEmpty: cartState.items.length === 0,
    hasItems: cartState.items.length > 0,
    subtotal: cartState.summary?.subtotal || 0,
    total: cartState.summary?.total || 0,
    hasLowStockItems: cartState.summary?.hasLowStockItems || false,
    hasOutOfStockItems: cartState.summary?.hasOutOfStockItems || false,
  }), [cartState.items.length, cartState.summary]);

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (!userId && !sessionId) return;
    
    try {
      await dispatch(loadCart()).unwrap();
    } catch {
      // Error handled by slice
    }
  }, [dispatch, userId, sessionId]);

  // Refresh item count only
  const refreshItemCount = useCallback(async () => {
    if (!userId && !sessionId) return;
    
    try {
      await dispatch(loadItemCount()).unwrap();
    } catch {
      // Error handled by slice
    }
  }, [dispatch, userId, sessionId]);

  // Add item to cart
  const addToCart = useCallback(async (request: Omit<AddToCartRequest, 'userId' | 'sessionId'>): Promise<boolean> => {
    if (!userId && !sessionId) {

      return false;
    }

    const fullRequest: AddToCartRequest = {
      ...request,
      userId: userId || '',
      sessionId: sessionId || ''
    };

    // Store current state for potential rollback
    const previousState = cartState.summary;

    try {
      // Optimistic update
      if (enableOptimisticUpdates) {
        const optimisticItem: CartItem = {
          id: `temp-${Date.now()}`,
          variant_id: request.variantId,
          product_id: request.productId,
          quantity: request.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        dispatch(optimisticAddItem(optimisticItem));
      }

      // API call
      await dispatch(addToCartAction(fullRequest)).unwrap();
      
      // Refresh cart to get accurate totals
      await refreshCart();
      
      return true;
    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && previousState) {
        dispatch(rollbackOptimisticUpdate({ originalState: cartState }));
      }
      
      return false;
    }
  }, [dispatch, userId, sessionId, enableOptimisticUpdates, cartState.summary, refreshCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (!userId && !sessionId) {

      return false;
    }

    // Store current state for potential rollback
    const previousState = cartState.summary;

    try {
      // Optimistic update
      if (enableOptimisticUpdates) {
        if (quantity === 0) {
          dispatch(optimisticRemoveItem({ cartItemId }));
        } else {
          dispatch(optimisticUpdateQuantity({ cartItemId, quantity }));
        }
      }

      // API call
      await dispatch(updateQuantityAction({ cartItemId, quantity })).unwrap();
      
      // Refresh cart to get accurate totals
      await refreshCart();
      
      return true;
    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && previousState) {
        dispatch(rollbackOptimisticUpdate({ originalState: cartState }));
      }
      
      return false;
    }
  }, [dispatch, userId, sessionId, enableOptimisticUpdates, cartState.summary, refreshCart]);

  // Remove item from cart
  const removeItem = useCallback(async (cartItemId: string): Promise<boolean> => {
    if (!userId && !sessionId) {

      return false;
    }

    // Store current state for potential rollback
    const previousState = cartState.summary;

    try {
      // Optimistic update
      if (enableOptimisticUpdates) {
        dispatch(optimisticRemoveItem({ cartItemId }));
      }

      // API call
      await dispatch(removeItemAction({ cartItemId })).unwrap();
      
      // Refresh cart to get accurate totals
      await refreshCart();
      
      return true;
    } catch {
      // Rollback optimistic update
      if (enableOptimisticUpdates && previousState) {
        dispatch(rollbackOptimisticUpdate({ originalState: cartState }));
      }
      
      return false;
    }
  }, [dispatch, userId, sessionId, enableOptimisticUpdates, cartState.summary, refreshCart]);

  // Clear entire cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!userId && !sessionId) {

      return false;
    }

    try {
      await dispatch(clearCartAsync()).unwrap();
      return true;
    } catch {
      return false;
    }
  }, [dispatch, userId, sessionId]);

  // Item utility functions
  const getItemById = useCallback((cartItemId: string): CartItem | undefined => {
    return cartState.items.find(item => item.id === cartItemId);
  }, [cartState.items]);

  const getItemByVariant = useCallback((variantId: string): CartItem | undefined => {
    return cartState.items.find(item => item.variant_id === variantId);
  }, [cartState.items]);

  const getItemQuantity = useCallback((variantId: string): number => {
    const item = getItemByVariant(variantId);
    return item ? item.quantity : 0;
  }, [getItemByVariant]);

  const canAddMore = useCallback((variantId: string, maxStock?: number): boolean => {
    if (!maxStock) return true;
    
    const currentQuantity = getItemQuantity(variantId);
    return currentQuantity < maxStock;
  }, [getItemQuantity]);

  // Action wrappers
  const clearErrorAction = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearLastAddedItemAction = useCallback(() => {
    dispatch(clearLastAddedItem());
  }, [dispatch]);

  return {
    // Cart state
    items: cartState.items,
    summary: cartState.summary,
    itemCount: cartState.itemCount,
    isLoading: cartState.isLoading,
    error: cartState.error,
    lastAddedItem: cartState.lastAddedItem,
    
    // Computed values
    ...computed,
    
    // Actions
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    refreshItemCount,
    
    // State management
    clearError: clearErrorAction,
    clearLastAddedItem: clearLastAddedItemAction,
    
    // Item utilities
    getItemById,
    getItemByVariant,
    getItemQuantity,
    canAddMore
  };
}

/**
 * Simple cart hook for basic cart operations
 * Use this when you only need basic cart functionality without optimistic updates
 */
export function useSimpleCart(userId?: string, sessionId?: string) {
  return useCart({
    userId,
    sessionId,
    enableOptimisticUpdates: false,
    autoRefresh: true
  });
}

/**
 * Cart count hook - lightweight hook for just getting cart item count
 * Use this in navigation badges where you only need the count
 */
export function useCartCount(userId?: string, sessionId?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const itemCount = useSelector((state: RootState) => state.cart.itemCount);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);

  const refreshCount = useCallback(async () => {
    if (!userId && !sessionId) return;
    
    try {
      await dispatch(loadItemCount()).unwrap();
    } catch {
      // Error handled by slice
    }
  }, [dispatch, userId, sessionId]);

  // Auto-refresh count on mount
  useEffect(() => {
    if (userId || sessionId) {
      refreshCount();
    }
  }, [userId, sessionId, refreshCount]);

  return {
    itemCount,
    isLoading,
    refreshCount
  };
}