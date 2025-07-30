import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  ProductVariant,
  getProductVariants,
  getCachedProductVariants,
  buildVariantMatrix,
  findVariantBySizeColor,
  getAvailableSizes,
  getAvailableColors,
  isCombinationAvailable,
  getVariantPricing,
  VariantMatrix
} from '@/utils/productVariantUtils';

export interface UseProductVariantsResult {
  // Data
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  selectedSize: string | null;
  selectedColor: string | null;
  
  // Available options
  availableSizes: string[];
  availableColors: string[];
  variantMatrix: VariantMatrix | null;
  
  // Pricing
  pricing: {
    minPrice: number;
    maxPrice: number;
    hasVariablePricing: boolean;
    currentPrice: number;
  };
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  selectVariant: (variantId: string) => void;
  selectSize: (size: string) => void;
  selectColor: (color: string) => void;
  clearSelection: () => void;
  retry: () => void;
}

export interface UseProductVariantsOptions {
  productId: string;
  enableCaching?: boolean;
  autoSelectFirstAvailable?: boolean;
  onVariantChange?: (variant: ProductVariant | null) => void;
  onSelectionChange?: (size: string | null, color: string | null) => void;
}

export function useProductVariants(options: UseProductVariantsOptions): UseProductVariantsResult {
  const {
    productId,
    enableCaching = true,
    autoSelectFirstAvailable = false,
    onVariantChange,
    onSelectionChange
  } = options;

  // State
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized calculations
  const variantMatrix = useMemo(() => {
    if (variants.length === 0) return null;
    return buildVariantMatrix(variants);
  }, [variants]);

  const availableSizes = useMemo(() => {
    return getAvailableSizes(variants, selectedColor || undefined);
  }, [variants, selectedColor]);

  const availableColors = useMemo(() => {
    return getAvailableColors(variants, selectedSize || undefined);
  }, [variants, selectedSize]);

  const pricing = useMemo(() => {
    const variantPricing = getVariantPricing(variants);
    const currentPrice = selectedVariant?.price || variantPricing.minPrice;
    
    return {
      ...variantPricing,
      currentPrice
    };
  }, [variants, selectedVariant]);

  // Load variants
  const loadVariants = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const productVariants = enableCaching
        ? await getCachedProductVariants(productId)
        : await getProductVariants(productId);

      setVariants(productVariants);

      // Auto-select first available variant if requested
      if (autoSelectFirstAvailable && productVariants.length > 0) {
        const firstAvailable = productVariants.find(v => v.quantity > 0);
        if (firstAvailable) {
          setSelectedVariant(firstAvailable);
          setSelectedSize(firstAvailable.option1);
          setSelectedColor(firstAvailable.option2);
        }
      }

    } catch (err) {
      console.error('Error loading variants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product variants');
    } finally {
      setIsLoading(false);
    }
  }, [productId, enableCaching, autoSelectFirstAvailable]);

  // Select variant by ID
  const selectVariant = useCallback((variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedSize(variant.option1);
      setSelectedColor(variant.option2);
      onVariantChange?.(variant);
      onSelectionChange?.(variant.option1, variant.option2);
    }
  }, [variants, onVariantChange, onSelectionChange]);

  // Select size
  const selectSize = useCallback((size: string) => {
    setSelectedSize(size);
    
    // Find matching variant with current color (if any)
    const variant = findVariantBySizeColor(variants, size, selectedColor || '');
    if (variant && variant.quantity > 0) {
      setSelectedVariant(variant);
      onVariantChange?.(variant);
    } else {
      // Clear variant if combination not available
      setSelectedVariant(null);
      onVariantChange?.(null);
    }
    
    onSelectionChange?.(size, selectedColor);
  }, [variants, selectedColor, onVariantChange, onSelectionChange]);

  // Select color
  const selectColor = useCallback((color: string) => {
    setSelectedColor(color);
    
    // Find matching variant with current size (if any)
    const variant = findVariantBySizeColor(variants, selectedSize || '', color);
    if (variant && variant.quantity > 0) {
      setSelectedVariant(variant);
      onVariantChange?.(variant);
    } else {
      // Clear variant if combination not available
      setSelectedVariant(null);
      onVariantChange?.(null);
    }
    
    onSelectionChange?.(selectedSize, color);
  }, [variants, selectedSize, onVariantChange, onSelectionChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedVariant(null);
    setSelectedSize(null);
    setSelectedColor(null);
    onVariantChange?.(null);
    onSelectionChange?.(null, null);
  }, [onVariantChange, onSelectionChange]);

  // Retry loading
  const retry = useCallback(() => {
    loadVariants();
  }, [loadVariants]);

  // Load variants on mount or productId change
  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  return {
    // Data
    variants,
    selectedVariant,
    selectedSize,
    selectedColor,
    
    // Available options
    availableSizes,
    availableColors,
    variantMatrix,
    
    // Pricing
    pricing,
    
    // State
    isLoading,
    error,
    
    // Actions
    selectVariant,
    selectSize,
    selectColor,
    clearSelection,
    retry
  };
}

/**
 * Simplified hook for basic variant selection
 */
export function useSimpleProductVariants(productId: string) {
  const result = useProductVariants({
    productId,
    enableCaching: true,
    autoSelectFirstAvailable: false
  });

  return {
    variants: result.variants,
    selectedVariant: result.selectedVariant,
    availableSizes: result.availableSizes,
    availableColors: result.availableColors,
    isLoading: result.isLoading,
    error: result.error,
    selectVariant: result.selectVariant,
    selectSize: result.selectSize,
    selectColor: result.selectColor
  };
}

/**
 * Hook for checking if size/color combinations are available
 */
export function useVariantAvailability(variants: ProductVariant[]) {
  const checkAvailability = useCallback((size: string, color: string) => {
    return isCombinationAvailable(variants, size, color);
  }, [variants]);

  const getVariantForCombination = useCallback((size: string, color: string) => {
    return findVariantBySizeColor(variants, size, color);
  }, [variants]);

  return {
    checkAvailability,
    getVariantForCombination
  };
}

/**
 * Hook for variant matrix operations
 */
export function useVariantMatrix(variants: ProductVariant[]) {
  const matrix = useMemo(() => {
    if (variants.length === 0) return null;
    return buildVariantMatrix(variants);
  }, [variants]);

  const getSizesForColor = useCallback((color: string) => {
    return getAvailableSizes(variants, color);
  }, [variants]);

  const getColorsForSize = useCallback((size: string) => {
    return getAvailableColors(variants, size);
  }, [variants]);

  return {
    matrix,
    getSizesForColor,
    getColorsForSize
  };
}