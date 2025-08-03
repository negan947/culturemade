/**
 * useProductInteraction Hook for CultureMade ProductCard System
 * 
 * React hook that provides robust click handling, analytics tracking, and user interaction
 * management for product components. Integrates with analytics utilities for comprehensive tracking.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

import { 
  trackProductClick,
  trackProductImpression,
  trackProductDetailView,
  trackAddToCart,
  debounce,
  throttle,
  getCurrentSession
} from '@/utils/analyticsUtils';

// =============================================================================
// HOOK INTERFACES
// =============================================================================

export interface UseProductInteractionOptions {
  enableAnalytics?: boolean;           // Enable/disable analytics tracking
  enableHapticFeedback?: boolean;      // Enable haptic feedback simulation
  debounceDelay?: number;              // Debounce delay for clicks (ms)
  impressionThrottle?: number;         // Throttle delay for impressions (ms)
  sourceComponent?: string;            // Source component for analytics
  categoryId?: string;                 // Category context for analytics
  searchQuery?: string;                // Search context for analytics
  positionIndex?: number;              // Position in grid/list
}

export interface UseProductInteractionResult {
  handleClick: (productId: string, options?: ClickOptions) => void;
  handleImpression: (productId: string) => void;
  handleDetailView: (productId: string, options?: DetailViewOptions) => void;
  handleAddToCart: (productId: string, options?: AddToCartOptions) => void;
  isProcessing: boolean;
  lastClickedProductId: string | null;
  clickCount: number;
  impressionRef: (node: HTMLElement | null) => void;
  resetInteraction: () => void;
}

export interface ClickOptions {
  clickTarget?: string;                // Which part was clicked
  additionalData?: Record<string, any>;
  skipHaptics?: boolean;
  skipAnalytics?: boolean;
}

export interface DetailViewOptions {
  referrer?: string;
  additionalData?: Record<string, any>;
  skipAnalytics?: boolean;
}

export interface AddToCartOptions {
  variantId?: string;
  quantity?: number;
  price?: number;
  additionalData?: Record<string, any>;
  skipAnalytics?: boolean;
}

// =============================================================================
// MAIN INTERACTION HOOK
// =============================================================================

/**
 * Main hook for product interaction handling and analytics
 * Provides comprehensive interaction management for product components
 */
export function useProductInteraction(
  options: UseProductInteractionOptions = {}
): UseProductInteractionResult {
  const {
    enableAnalytics = true,
    enableHapticFeedback = true,
    debounceDelay = 300,
    impressionThrottle = 1000,
    sourceComponent = 'product_grid',
    categoryId,
    searchQuery,
    positionIndex
  } = options;

  // State for interaction tracking
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastClickedProductId, setLastClickedProductId] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Refs for tracking and preventing duplicate events
  const lastClickTime = useRef<number>(0);
  const impressedProducts = useRef<Set<string>>(new Set());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  // =============================================================================
  // HAPTIC FEEDBACK SIMULATION
  // =============================================================================

  const simulateHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback) return;

    // Simulate haptic feedback with visual/audio cues
    try {
      // Try to use actual haptic feedback if available (mobile)
      if ('vibrate' in navigator) {
        const vibrationPattern = {
          light: [10],
          medium: [50],
          heavy: [100]
        };
        navigator.vibrate(vibrationPattern[type]);
      }

      // Visual feedback simulation
      document.body.style.transition = 'transform 0.05s ease-out';
      document.body.style.transform = 'scale(0.999)';
      
      setTimeout(() => {
        document.body.style.transform = 'scale(1)';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 50);
      }, 50);
    } catch (_error) {
      // Ignore haptic feedback errors
    }
  }, [enableHapticFeedback]);

  // =============================================================================
  // CLICK HANDLING
  // =============================================================================

  const handleClickInternal = useCallback((productId: string, options: ClickOptions = {}) => {
    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTime.current < debounceDelay) {
      return;
    }
    
    lastClickTime.current = now;
    setIsProcessing(true);
    setLastClickedProductId(productId);
    setClickCount(prev => prev + 1);

    try {
      // Simulate haptic feedback
      if (!options.skipHaptics) {
        simulateHapticFeedback('light');
      }

      // Track analytics
      if (enableAnalytics && !options.skipAnalytics) {
        trackProductClick(productId, sourceComponent, {
          ...(positionIndex !== undefined && { positionIndex }),
          ...(searchQuery !== undefined && { searchQuery }),
          ...(categoryId !== undefined && { categoryId }),
          ...(options.clickTarget !== undefined && { clickTarget: options.clickTarget }),
          additionalData: {
            session_id: getCurrentSession().sessionId,
            click_count: clickCount + 1,
            ...options.additionalData
          }
        });
      }

      // Log for debugging
      console.debug('Product click handled:', {
        productId,
        sourceComponent,
        clickTarget: options.clickTarget,
        timestamp: new Date().toISOString()
      });

    } catch (_error) {

    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 150);
    }
  }, [
    debounceDelay,
    enableAnalytics,
    simulateHapticFeedback,
    sourceComponent,
    positionIndex,
    searchQuery,
    categoryId,
    clickCount
  ]);

  // Debounced click handler to prevent rapid firing
  const handleClick = useCallback(
    debounce(handleClickInternal, debounceDelay),
    [handleClickInternal, debounceDelay]
  );

  // =============================================================================
  // IMPRESSION TRACKING
  // =============================================================================

  const handleImpressionInternal = useCallback((productId: string) => {
    // Prevent duplicate impressions
    if (impressedProducts.current.has(productId)) {
      return;
    }

    impressedProducts.current.add(productId);

    if (enableAnalytics) {
      trackProductImpression(productId, sourceComponent, {
        ...(positionIndex !== undefined && { positionIndex }),
        ...(searchQuery !== undefined && { searchQuery }),
        ...(categoryId !== undefined && { categoryId }),
        additionalData: {
          session_id: getCurrentSession().sessionId,
          viewport_visible: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.debug('Product impression tracked:', {
      productId,
      sourceComponent,
      positionIndex,
      timestamp: new Date().toISOString()
    });
  }, [enableAnalytics, sourceComponent, positionIndex, searchQuery, categoryId]);

  // Throttled impression handler to prevent spam
  const handleImpression = useCallback(
    throttle(handleImpressionInternal, impressionThrottle),
    [handleImpressionInternal, impressionThrottle]
  );

  // =============================================================================
  // INTERSECTION OBSERVER FOR IMPRESSIONS
  // =============================================================================

  const impressionRef = useCallback((node: HTMLElement | null) => {
    // Clean up previous observer
    if (intersectionObserver.current) {
      intersectionObserver.current.disconnect();
    }

    if (!node) return;

    // Create new intersection observer
    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const productId = entry.target.getAttribute('data-product-id');
            if (productId) {
              handleImpression(productId);
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% visible
        rootMargin: '0px 0px -50px 0px' // Small margin to avoid false positives
      }
    );

    intersectionObserver.current.observe(node);
  }, [handleImpression]);

  // =============================================================================
  // SPECIALIZED EVENT HANDLERS
  // =============================================================================

  const handleDetailView = useCallback((productId: string, options: DetailViewOptions = {}) => {
    if (!enableAnalytics || options.skipAnalytics) return;

    trackProductDetailView(productId, sourceComponent, {
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      referrer: options.referrer || document.referrer,
      additionalData: {
        session_id: getCurrentSession().sessionId,
        opened_from: sourceComponent,
        ...(positionIndex !== undefined && { position_index: positionIndex }),
        ...options.additionalData
      }
    });

    console.debug('Product detail view tracked:', {
      productId,
      sourceComponent,
      referrer: options.referrer,
      timestamp: new Date().toISOString()
    });
  }, [enableAnalytics, sourceComponent, searchQuery, categoryId, positionIndex]);

  const handleAddToCart = useCallback((productId: string, options: AddToCartOptions = {}) => {
    if (!enableAnalytics || options.skipAnalytics) return;

    // Simulate haptic feedback for add to cart
    simulateHapticFeedback('medium');

    trackAddToCart(productId, sourceComponent, {
      ...(options.variantId !== undefined && { variantId: options.variantId }),
      quantity: options.quantity || 1,
      ...(options.price !== undefined && { price: options.price }),
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      additionalData: {
        session_id: getCurrentSession().sessionId,
        added_from: sourceComponent,
        ...(positionIndex !== undefined && { position_index: positionIndex }),
        ...options.additionalData
      }
    });

    console.debug('Add to cart tracked:', {
      productId,
      variantId: options.variantId,
      quantity: options.quantity,
      price: options.price,
      timestamp: new Date().toISOString()
    });
  }, [enableAnalytics, simulateHapticFeedback, sourceComponent, searchQuery, categoryId, positionIndex]);

  // =============================================================================
  // CLEANUP AND RESET
  // =============================================================================

  const resetInteraction = useCallback(() => {
    setIsProcessing(false);
    setLastClickedProductId(null);
    setClickCount(0);
    lastClickTime.current = 0;
    impressedProducts.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
    };
  }, []);

  return {
    handleClick,
    handleImpression,
    handleDetailView,
    handleAddToCart,
    isProcessing,
    lastClickedProductId,
    clickCount,
    impressionRef,
    resetInteraction
  };
}

// =============================================================================
// SPECIALIZED INTERACTION HOOKS
// =============================================================================

/**
 * Hook for simple click handling without analytics
 * Ideal for components that only need click functionality
 */
export function useSimpleProductClick(
  onProductClick: (productId: string) => void,
  debounceDelay: number = 300
): {
  handleClick: (productId: string) => void;
  isProcessing: boolean;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastClickTime = useRef<number>(0);

  const handleClick = useCallback((productId: string) => {
    const now = Date.now();
    
    if (now - lastClickTime.current < debounceDelay) {
      return;
    }
    
    lastClickTime.current = now;
    setIsProcessing(true);

    try {
      onProductClick(productId);
    } catch (_error) {

    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 150);
    }
  }, [onProductClick, debounceDelay]);

  return {
    handleClick: useCallback(debounce(handleClick, debounceDelay), [handleClick, debounceDelay]),
    isProcessing
  };
}

/**
 * Hook for analytics-only interaction tracking
 * Ideal for components that need tracking without UI feedback
 */
export function useProductAnalytics(
  sourceComponent: string,
  options: Pick<UseProductInteractionOptions, 'categoryId' | 'searchQuery' | 'positionIndex'> = {}
): {
  trackClick: (productId: string, clickTarget?: string) => void;
  trackImpression: (productId: string) => void;
  trackDetailView: (productId: string, referrer?: string) => void;
  trackAddToCart: (productId: string, variantId?: string, quantity?: number, price?: number) => void;
} {
  const { categoryId, searchQuery, positionIndex } = options;

  const trackClick = useCallback((productId: string, clickTarget?: string) => {
    trackProductClick(productId, sourceComponent, {
      ...(positionIndex !== undefined && { positionIndex }),
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      ...(clickTarget !== undefined && { clickTarget }),
      additionalData: {
        session_id: getCurrentSession().sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [sourceComponent, positionIndex, searchQuery, categoryId]);

  const trackImpression = useCallback((productId: string) => {
    trackProductImpression(productId, sourceComponent, {
      ...(positionIndex !== undefined && { positionIndex }),
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      additionalData: {
        session_id: getCurrentSession().sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [sourceComponent, positionIndex, searchQuery, categoryId]);

  const trackDetailView = useCallback((productId: string, referrer?: string) => {
    trackProductDetailView(productId, sourceComponent, {
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      referrer: referrer || document.referrer,
      additionalData: {
        session_id: getCurrentSession().sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [sourceComponent, searchQuery, categoryId]);

  const trackAddToCartAction = useCallback((
    productId: string, 
    variantId?: string, 
    quantity?: number, 
    price?: number
  ) => {
    trackAddToCart(productId, sourceComponent, {
      ...(variantId !== undefined && { variantId }),
      quantity: quantity || 1,
      ...(price !== undefined && { price }),
      ...(searchQuery !== undefined && { searchQuery }),
      ...(categoryId !== undefined && { categoryId }),
      additionalData: {
        session_id: getCurrentSession().sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [sourceComponent, searchQuery, categoryId]);

  return {
    trackClick,
    trackImpression,
    trackDetailView,
    trackAddToCart: trackAddToCartAction
  };
}

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export default useProductInteraction;