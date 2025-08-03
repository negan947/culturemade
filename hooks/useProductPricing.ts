/**
 * useProductPricing Hook for CultureMade ProductCard System
 * 
 * React hook that provides pricing logic and formatting for product components.
 * Integrates with pricing utilities and provides memoized pricing calculations.
 */

import { useMemo } from 'react';

import { ProductListItem, ProductVariant } from '@/types/api';
import { 
  calculatePricingInfo, 
  calculateVariantPricing,
  PricingInfo, 
  PriceDisplayOptions 
} from '@/utils/pricingUtils';

// =============================================================================
// HOOK INTERFACES
// =============================================================================

export interface UseProductPricingOptions extends PriceDisplayOptions {
  variants?: ProductVariant[];     // Optional variants for detailed pricing
  selectedVariantId?: string;      // Selected variant for specific pricing
}

export interface UseProductPricingResult {
  pricing: PricingInfo;
  selectedVariantPricing?: PricingInfo;
  formatPrice: (amount: number) => string;
  isOnSale: boolean;
  discountText?: string;           // "20% off" or "Save $10"
  priceText: string;               // Main price display text
  originalPriceText?: string;      // Crossed out original price
  savingsText?: string;            // "You save $10.00"
  hasVariants: boolean;
  canShowFromPrice: boolean;       // Whether "from" prefix makes sense
}

// =============================================================================
// MAIN PRICING HOOK
// =============================================================================

/**
 * Main hook for product pricing calculations and formatting
 * Provides comprehensive pricing information for product components
 */
export function useProductPricing(
  product: ProductListItem,
  options: UseProductPricingOptions = {}
): UseProductPricingResult {
  const {
    variants = [],
    selectedVariantId,
    showCurrency = true,
    showComparePricing = true,
    useFromPrefix = true,
    currencyCode = 'USD',
    locale = 'en-US'
  } = options;

  // Calculate base product pricing (memoized for performance)
  const pricing = useMemo(() => {
    return calculatePricingInfo(product, {
      showCurrency,
      showComparePricing,
      useFromPrefix,
      currencyCode,
      locale
    });
  }, [product, showCurrency, showComparePricing, useFromPrefix, currencyCode, locale]);

  // Calculate variant-specific pricing if variant is selected
  const selectedVariantPricing = useMemo(() => {
    if (!selectedVariantId || !variants.length) return undefined;

    const selectedVariant = variants.find(v => v.id === selectedVariantId);
    if (!selectedVariant) return undefined;

    return calculateVariantPricing(
      [selectedVariant],
      parseFloat(product.price),
      product.compare_at_price ? parseFloat(product.compare_at_price) : null,
      { currencyCode, locale }
    );
  }, [selectedVariantId, variants, product.price, product.compare_at_price, currencyCode, locale]);

  // Determine which pricing to use for display
  const activePricing = selectedVariantPricing || pricing;

  // Format price function
  const formatPrice = useMemo(() => {
    return (amount: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch (_error) {
        return `$${amount.toFixed(2)}`;
      }
    };
  }, [locale, currencyCode]);

  // Calculate discount text
  const discountText = useMemo(() => {
    if (!activePricing.isOnSale || !activePricing.discountPercentage) return undefined;
    return `${activePricing.discountPercentage}% off`;
  }, [activePricing.isOnSale, activePricing.discountPercentage]);

  // Calculate savings text
  const savingsText = useMemo(() => {
    if (!activePricing.isOnSale || !activePricing.originalPrice) return undefined;
    
    const originalAmount = parseFloat(activePricing.originalPrice.replace(/[^0-9.]/g, ''));
    const currentAmount = activePricing.lowestPrice;
    const savings = originalAmount - currentAmount;
    
    return `You save ${formatPrice(savings)}`;
  }, [activePricing.isOnSale, activePricing.originalPrice, activePricing.lowestPrice, formatPrice]);

  // Determine display characteristics
  const hasVariants = variants.length > 0;
  const canShowFromPrice = pricing.hasVariablePricing && !selectedVariantId;

  return {
    pricing: activePricing,
    selectedVariantPricing,
    formatPrice,
    isOnSale: activePricing.isOnSale,
    discountText,
    priceText: activePricing.displayPrice,
    originalPriceText: activePricing.originalPrice,
    savingsText,
    hasVariants,
    canShowFromPrice
  };
}

// =============================================================================
// SPECIALIZED PRICING HOOKS
// =============================================================================

/**
 * Hook for simple price display (minimal formatting)
 * Ideal for product cards that need basic pricing
 */
export function useSimpleProductPricing(
  product: ProductListItem,
  options: Pick<UseProductPricingOptions, 'currencyCode' | 'locale'> = {}
): {
  price: string;
  originalPrice?: string;
  isOnSale: boolean;
  discount?: string;
} {
  const { pricing } = useProductPricing(product, {
    ...options,
    showComparePricing: true,
    useFromPrefix: true
  });

  return {
    price: pricing.displayPrice,
    originalPrice: pricing.originalPrice,
    isOnSale: pricing.isOnSale,
    discount: pricing.discountPercentage ? `${pricing.discountPercentage}% off` : undefined
  };
}

/**
 * Hook for variant selection pricing
 * Handles dynamic pricing when user selects different variants
 */
export function useVariantPricing(
  product: ProductListItem,
  variants: ProductVariant[],
  selectedVariantId?: string
): {
  basePricing: PricingInfo;
  variantPricing?: PricingInfo;
  priceChanged: boolean;
  priceChangeAmount: number;
  isMoreExpensive: boolean;
} {
  const basePricing = useMemo(() => {
    return calculatePricingInfo(product);
  }, [product]);

  const variantPricing = useMemo(() => {
    if (!selectedVariantId || !variants.length) return undefined;

    const selectedVariant = variants.find(v => v.id === selectedVariantId);
    if (!selectedVariant) return undefined;

    return calculateVariantPricing(
      [selectedVariant],
      parseFloat(product.price),
      product.compare_at_price ? parseFloat(product.compare_at_price) : null
    );
  }, [selectedVariantId, variants, product.price, product.compare_at_price]);

  const priceChanged = !!(variantPricing && variantPricing.lowestPrice !== basePricing.lowestPrice);
  const priceChangeAmount = variantPricing 
    ? Math.abs(variantPricing.lowestPrice - basePricing.lowestPrice)
    : 0;
  const isMoreExpensive = variantPricing 
    ? variantPricing.lowestPrice > basePricing.lowestPrice
    : false;

  return {
    basePricing,
    variantPricing,
    priceChanged,
    priceChangeAmount,
    isMoreExpensive
  };
}

/**
 * Hook for bulk pricing calculations
 * Optimized for product grids and catalog displays
 */
export function useBulkProductPricing(
  products: ProductListItem[],
  options: PriceDisplayOptions = {}
): Map<string, PricingInfo> {
  return useMemo(() => {
    const pricingMap = new Map<string, PricingInfo>();
    
    for (const product of products) {
      try {
        const pricing = calculatePricingInfo(product, options);
        pricingMap.set(product.id, pricing);
      } catch (_error) {

        
        // Fallback pricing
        pricingMap.set(product.id, {
          displayPrice: '$0.00',
          isOnSale: false,
          priceRange: { min: 0, max: 0 },
          hasVariablePricing: false,
          lowestPrice: 0,
          currency: options.currencyCode || 'USD'
        });
      }
    }
    
    return pricingMap;
  }, [products, options]);
}

// =============================================================================
// PRICE COMPARISON HOOKS
// =============================================================================

/**
 * Hook for comparing prices between products
 * Useful for showing relative value and deals
 */
export function usePriceComparison(
  products: ProductListItem[]
): {
  cheapest: ProductListItem | null;
  mostExpensive: ProductListItem | null;
  averagePrice: number;
  priceRange: { min: number; max: number };
  dealProducts: ProductListItem[];  // Products with compare_at_price
} {
  return useMemo(() => {
    if (!products.length) {
      return {
        cheapest: null,
        mostExpensive: null,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        dealProducts: []
      };
    }

    const prices = products.map(p => parseFloat(p.min_price));
    const minPrice = Math.min(..._prices);
    const maxPrice = Math.max(..._prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    const cheapest = products.find(p => parseFloat(p.min_price) === minPrice) || null;
    const mostExpensive = products.find(p => parseFloat(p.max_price) === maxPrice) || null;
    const dealProducts = products.filter(p => p.compare_at_price);

    return {
      cheapest,
      mostExpensive,
      averagePrice: Math.round(averagePrice * 100) / 100,
      priceRange: { min: minPrice, max: maxPrice },
      dealProducts
    };
  }, [products]);
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for currency formatting
 * Provides consistent currency formatting across components
 */
export function useCurrencyFormatter(
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): (amount: number) => string {
  return useMemo(() => {
    return (amount: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch (_error) {
        return `$${amount.toFixed(2)}`;
      }
    };
  }, [currencyCode, locale]);
}

/**
 * Hook for price range validation
 * Validates if a product's price falls within a given range
 */
export function usePriceRangeFilter(
  minPrice?: number,
  maxPrice?: number
): (product: ProductListItem) => boolean {
  return useMemo(() => {
    return (product: ProductListItem) => {
      const productPrice = parseFloat(product.min_price);
      
      if (minPrice !== undefined && productPrice < minPrice) return false;
      if (maxPrice !== undefined && productPrice > maxPrice) return false;
      
      return true;
    };
  }, [minPrice, maxPrice]);
}

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export default useProductPricing;