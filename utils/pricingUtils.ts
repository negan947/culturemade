/**
 * Pricing Utilities for CultureMade ProductCard System
 * 
 * Provides comprehensive pricing calculation and formatting utilities
 * for complex product scenarios with variant pricing and discounts.
 */

import { ProductListItem, ProductVariant } from '@/types/api';

// =============================================================================
// PRICING INTERFACES
// =============================================================================

export interface PricingInfo {
  displayPrice: string;           // "$24.99" or "from $19.99"
  originalPrice?: string;         // "$29.99" (if on sale)
  discountPercentage?: number;    // 20 (for 20% off)
  isOnSale: boolean;
  priceRange: { min: number; max: number };
  hasVariablePricing: boolean;    // true if variants have different prices
  lowestPrice: number;            // numeric value for comparisons
  currency: string;               // 'USD'
}

export interface PriceDisplayOptions {
  showCurrency?: boolean;         // default: true
  showComparePricing?: boolean;   // default: true
  useFromPrefix?: boolean;        // default: true for variable pricing
  currencyCode?: string;          // default: 'USD'
  locale?: string;                // default: 'en-US'
}

// =============================================================================
// CORE PRICING CALCULATIONS
// =============================================================================

/**
 * Calculate comprehensive pricing information from product data
 * Handles single/multiple variants, sales, and discount calculations
 */
export function calculatePricingInfo(
  product: ProductListItem,
  options: PriceDisplayOptions = {}
): PricingInfo {
  const {
    showCurrency = true,
    showComparePricing = true,
    useFromPrefix = true,
    currencyCode = 'USD',
    locale = 'en-US'
  } = options;

  // Parse base product pricing
  const basePrice = parseFloat(product.price);
  const compareAtPrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  
  // Calculate min/max from product metadata (already computed in API)
  const minPrice = parseFloat(product.min_price);
  const maxPrice = parseFloat(product.max_price);
  
  // Determine if product has variable pricing across variants
  const hasVariablePricing = minPrice !== maxPrice;
  
  // Calculate sale information
  const isOnSale = compareAtPrice ? compareAtPrice > basePrice : false;
  const discountPercentage = isOnSale && compareAtPrice 
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : undefined;

  // Format display price
  let displayPrice: string;
  if (hasVariablePricing && useFromPrefix) {
    displayPrice = `from ${formatCurrency(minPrice, currencyCode, locale)}`;
  } else {
    displayPrice = formatCurrency(basePrice, currencyCode, locale);
  }

  // Format original price if on sale
  const originalPrice = isOnSale && compareAtPrice && showComparePricing
    ? formatCurrency(compareAtPrice, currencyCode, locale)
    : undefined;

  return {
    displayPrice,
    originalPrice,
    discountPercentage,
    isOnSale,
    priceRange: { min: minPrice, max: maxPrice },
    hasVariablePricing,
    lowestPrice: minPrice,
    currency: currencyCode
  };
}

/**
 * Calculate pricing for specific product variants
 * Used when user selects specific size/color combinations
 */
export function calculateVariantPricing(
  variants: ProductVariant[],
  basePrice: number,
  compareAtPrice?: number | null,
  options: PriceDisplayOptions = {}
): PricingInfo {
  const { currencyCode = 'USD', locale = 'en-US' } = options;

  if (!variants.length) {
    return {
      displayPrice: formatCurrency(basePrice, currencyCode, locale),
      isOnSale: false,
      priceRange: { min: basePrice, max: basePrice },
      hasVariablePricing: false,
      lowestPrice: basePrice,
      currency: currencyCode
    };
  }

  // Extract variant prices (fallback to base price if variant price is null)
  const variantPrices = variants
    .map(variant => variant.price ? parseFloat(variant.price) : basePrice)
    .filter(price => !isNaN(price));

  const minPrice = Math.min(...variantPrices);
  const maxPrice = Math.max(...variantPrices);
  const hasVariablePricing = minPrice !== maxPrice;

  // Use lowest price for display when variable
  const displayBasePrice = hasVariablePricing ? minPrice : basePrice;
  
  // Calculate sale information
  const isOnSale = compareAtPrice ? compareAtPrice > displayBasePrice : false;
  const discountPercentage = isOnSale && compareAtPrice 
    ? Math.round(((compareAtPrice - displayBasePrice) / compareAtPrice) * 100)
    : undefined;

  return {
    displayPrice: hasVariablePricing 
      ? `from ${formatCurrency(minPrice, currencyCode, locale)}`
      : formatCurrency(displayBasePrice, currencyCode, locale),
    originalPrice: isOnSale && compareAtPrice 
      ? formatCurrency(compareAtPrice, currencyCode, locale) 
      : undefined,
    discountPercentage,
    isOnSale,
    priceRange: { min: minPrice, max: maxPrice },
    hasVariablePricing,
    lowestPrice: minPrice,
    currency: currencyCode
  };
}

// =============================================================================
// PRICE FORMATTING UTILITIES
// =============================================================================

/**
 * Format numeric price to localized currency string
 * Handles USD formatting with proper comma separators
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales/currencies
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/**
 * Parse currency string back to numeric value
 * Handles various currency formats and removes symbols/commas
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString) return 0;
  
  // Remove currency symbols, letters, and whitespace, keep digits, dots, and commas
  const cleanString = currencyString.replace(/[^\d.,-]/g, '');
  
  // Handle comma as decimal separator (European format)
  const normalizedString = cleanString.includes(',') && !cleanString.includes('.')
    ? cleanString.replace(',', '.')
    : cleanString.replace(/,/g, ''); // Remove commas (thousands separators)
  
  const parsed = parseFloat(normalizedString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate price difference percentage between two prices
 * Useful for showing discount percentages and price comparisons
 */
export function calculatePriceChange(oldPrice: number, newPrice: number): {
  percentage: number;
  isIncrease: boolean;
  difference: number;
} {
  if (oldPrice === 0) return { percentage: 0, isIncrease: false, difference: 0 };
  
  const difference = newPrice - oldPrice;
  const percentage = Math.abs((difference / oldPrice) * 100);
  
  return {
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    isIncrease: difference > 0,
    difference: Math.abs(difference)
  };
}

// =============================================================================
// PRICE COMPARISON UTILITIES
// =============================================================================

/**
 * Compare prices for sorting and filtering
 * Handles currency strings and numeric values
 */
export function comparePrices(priceA: string | number, priceB: string | number): number {
  const numA = typeof priceA === 'string' ? parseCurrency(priceA) : priceA;
  const numB = typeof priceB === 'string' ? parseCurrency(priceB) : priceB;
  
  return numA - numB;
}

/**
 * Check if a price falls within a given range
 * Used for price filtering in product catalogs
 */
export function isPriceInRange(
  price: string | number,
  minPrice?: number,
  maxPrice?: number
): boolean {
  const numPrice = typeof price === 'string' ? parseCurrency(price) : price;
  
  if (minPrice !== undefined && numPrice < minPrice) return false;
  if (maxPrice !== undefined && numPrice > maxPrice) return false;
  
  return true;
}

// =============================================================================
// BULK PRICING UTILITIES
// =============================================================================

/**
 * Calculate bulk pricing information for multiple products
 * Optimized for performance with large product catalogs
 */
export function calculateBulkPricing(
  products: ProductListItem[],
  options: PriceDisplayOptions = {}
): Map<string, PricingInfo> {
  const pricingMap = new Map<string, PricingInfo>();
  
  for (const product of products) {
    try {
      const pricingInfo = calculatePricingInfo(product, options);
      pricingMap.set(product.id, pricingInfo);
    } catch (error) {
      console.warn(`Failed to calculate pricing for product ${product.id}:`, error);
      
      // Fallback pricing info
      pricingMap.set(product.id, {
        displayPrice: formatCurrency(parseFloat(product.price) || 0),
        isOnSale: false,
        priceRange: { min: 0, max: 0 },
        hasVariablePricing: false,
        lowestPrice: parseFloat(product.price) || 0,
        currency: options.currencyCode || 'USD'
      });
    }
  }
  
  return pricingMap;
}

// =============================================================================
// PRICE VALIDATION UTILITIES
// =============================================================================

/**
 * Validate price data for consistency and business rules
 * Ensures pricing data meets business requirements
 */
export function validatePricing(product: ProductListItem): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const price = parseFloat(product.price);
  const compareAtPrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const minPrice = parseFloat(product.min_price);
  const maxPrice = parseFloat(product.max_price);
  
  // Basic price validation
  if (isNaN(price) || price < 0) {
    errors.push('Product price must be a valid positive number');
  }
  
  if (price === 0) {
    warnings.push('Product price is zero - consider if this is intentional');
  }
  
  // Compare at price validation
  if (compareAtPrice !== null) {
    if (isNaN(compareAtPrice) || compareAtPrice < 0) {
      errors.push('Compare at price must be a valid positive number');
    } else if (compareAtPrice <= price) {
      warnings.push('Compare at price should be higher than regular price for meaningful discounts');
    }
  }
  
  // Price range validation
  if (isNaN(minPrice) || isNaN(maxPrice)) {
    errors.push('Min and max prices must be valid numbers');
  } else {
    if (minPrice > maxPrice) {
      errors.push('Minimum price cannot be greater than maximum price');
    }
    
    if (price < minPrice || price > maxPrice) {
      warnings.push('Product base price is outside the min/max price range');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export const PricingUtils = {
  calculate: calculatePricingInfo,
  calculateVariant: calculateVariantPricing,
  format: formatCurrency,
  parse: parseCurrency,
  compare: comparePrices,
  isInRange: isPriceInRange,
  calculateBulk: calculateBulkPricing,
  validate: validatePricing,
  calculateChange: calculatePriceChange,
} as const;

export default PricingUtils;