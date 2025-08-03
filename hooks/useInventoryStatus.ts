/**
 * useInventoryStatus Hook for CultureMade ProductCard System
 * 
 * React hook that provides inventory status determination and badge logic
 * for product components. Integrates with inventory utilities for real-time stock indicators.
 */

import { useMemo } from 'react';

import { ProductListItem, ProductVariant } from '@/types/api';
import { 
  calculateInventoryStatus, 
  calculateVariantInventory,
  getBadgeConfig,
  getInventoryCardClasses,
  getStockLevelText,
  InventoryStatus,
  InventoryThresholds,
  VariantInventoryInfo
} from '@/utils/inventoryUtils';

// =============================================================================
// HOOK INTERFACES
// =============================================================================

export interface UseInventoryStatusOptions extends Partial<InventoryThresholds> {
  variants?: ProductVariant[] | undefined;           // Optional variants for detailed inventory
  selectedVariantId?: string | undefined;            // Selected variant for specific inventory
  showExactQuantity?: boolean | undefined;           // Show exact numbers vs. text levels
  enableBadges?: boolean | undefined;                // Enable/disable badge display
}

export interface UseInventoryStatusResult {
  inventory: InventoryStatus;
  selectedVariantInventory?: VariantInventoryInfo;
  badge: ReturnType<typeof getBadgeConfig>;
  cardClasses: ReturnType<typeof getInventoryCardClasses>;
  stockText: string;
  isAvailable: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isNew: boolean;
  isOnSale: boolean;
  showStockWarning: boolean;             // Show low stock warnings
  availableVariantCount?: number;        // Number of available variants
  totalVariantCount?: number;            // Total number of variants
}

// =============================================================================
// MAIN INVENTORY HOOK
// =============================================================================

/**
 * Main hook for product inventory status and availability
 * Provides comprehensive inventory information for product components
 */
export function useInventoryStatus(
  product: ProductListItem,
  options: UseInventoryStatusOptions = {}
): UseInventoryStatusResult {
  const {
    variants = [],
    selectedVariantId,
    showExactQuantity = false,
    enableBadges = true,
    lowStockThreshold = 5,
    newProductDays = 30,
    outOfStockThreshold = 0
  } = options;

  // Calculate base product inventory status (memoized for performance)
  const inventory = useMemo(() => {
    return calculateInventoryStatus(product, {
      lowStockThreshold,
      newProductDays,
      outOfStockThreshold
    });
  }, [product, lowStockThreshold, newProductDays, outOfStockThreshold]);

  // Calculate variant-specific inventory if variants exist
  const variantInventoryData = useMemo(() => {
    if (!variants.length) return null;

    return calculateVariantInventory(variants, {
      lowStockThreshold,
      newProductDays,
      outOfStockThreshold
    });
  }, [variants, lowStockThreshold, newProductDays, outOfStockThreshold]);

  // Get selected variant inventory info
  const selectedVariantInventory = useMemo(() => {
    if (!selectedVariantId || !variantInventoryData) return undefined;

    return variantInventoryData.variantInfo.find(v => v.variantId === selectedVariantId);
  }, [selectedVariantId, variantInventoryData]);

  // Determine badge configuration
  const badge = useMemo(() => {
    if (!enableBadges) return null;
    return getBadgeConfig(inventory);
  }, [inventory, enableBadges]);

  // Get CSS classes for product card styling
  const cardClasses = useMemo(() => {
    // Use selected variant availability if variant is selected, otherwise use product availability
    const effectiveInventory = selectedVariantInventory 
      ? { ...inventory, status: selectedVariantInventory.isAvailable ? inventory.status : 'out_of_stock' as const }
      : inventory;

    return getInventoryCardClasses(effectiveInventory);
  }, [inventory, selectedVariantInventory]);

  // Generate stock level text
  const stockText = useMemo(() => {
    // If variant is selected, use variant-specific text
    if (selectedVariantInventory) {
      if (!selectedVariantInventory.isAvailable) {
        return 'Out of Stock';
      }
      
      if (showExactQuantity) {
        const itemText = selectedVariantInventory.quantity === 1 ? 'item' : 'items';
        return `${selectedVariantInventory.quantity} ${itemText} left`;
      }
      
      switch (selectedVariantInventory.stockLevel) {
        case 'high':
          return 'In Stock';
        case 'medium':
          return 'Limited Stock';
        case 'low':
          return 'Only a few left';
        case 'none':
          return 'Out of Stock';
        default:
          return 'Check Availability';
      }
    }

    // Use product-level inventory text
    return getStockLevelText(inventory, showExactQuantity);
  }, [inventory, selectedVariantInventory, showExactQuantity]);

  // Determine availability status
  const isAvailable = selectedVariantInventory 
    ? selectedVariantInventory.isAvailable 
    : inventory.isAvailable;

  const isLowStock = selectedVariantInventory
    ? selectedVariantInventory.stockLevel === 'low'
    : inventory.status === 'low_stock';

  const isOutOfStock = selectedVariantInventory
    ? !selectedVariantInventory.isAvailable
    : inventory.status === 'out_of_stock';

  const showStockWarning = isLowStock && isAvailable;

  return {
    inventory,
    ...(selectedVariantInventory && { selectedVariantInventory }),
    badge,
    cardClasses,
    stockText,
    isAvailable,
    isLowStock,
    isOutOfStock,
    isNew: inventory.isNew,
    isOnSale: inventory.isOnSale,
    showStockWarning,
    ...(variantInventoryData?.availableVariants !== undefined && { availableVariantCount: variantInventoryData.availableVariants }),
    ...(variants.length > 0 && { totalVariantCount: variants.length })
  };
}

// =============================================================================
// SPECIALIZED INVENTORY HOOKS
// =============================================================================

/**
 * Hook for simple availability checking
 * Ideal for basic in-stock/out-of-stock display
 */
export function useSimpleAvailability(
  product: ProductListItem,
  options: Pick<UseInventoryStatusOptions, 'outOfStockThreshold'> = {}
): {
  isAvailable: boolean;
  isOutOfStock: boolean;
  totalQuantity: number;
  statusText: string;
} {
  const { inventory } = useInventoryStatus(product, options);

  return {
    isAvailable: inventory.isAvailable,
    isOutOfStock: inventory.status === 'out_of_stock',
    totalQuantity: inventory.totalQuantity,
    statusText: inventory.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'
  };
}

/**
 * Hook for variant availability tracking
 * Handles availability when user selects different variants
 */
export function useVariantAvailability(
  product: ProductListItem,
  variants: ProductVariant[],
  selectedVariantId?: string
): {
  productAvailability: InventoryStatus;
  variantAvailability?: VariantInventoryInfo;
  availabilityChanged: boolean;
  isSelectedVariantAvailable: boolean;
  availableVariants: VariantInventoryInfo[];
  outOfStockVariants: VariantInventoryInfo[];
} {
  const productAvailability = useMemo(() => {
    return calculateInventoryStatus(product);
  }, [product]);

  const variantData = useMemo(() => {
    if (!variants.length) return null;
    return calculateVariantInventory(variants);
  }, [variants]);

  const variantAvailability = useMemo(() => {
    if (!selectedVariantId || !variantData) return undefined;
    return variantData.variantInfo.find(v => v.variantId === selectedVariantId);
  }, [selectedVariantId, variantData]);

  const availabilityChanged = !!(variantAvailability && 
    variantAvailability.isAvailable !== productAvailability.isAvailable);

  const isSelectedVariantAvailable = variantAvailability?.isAvailable ?? productAvailability.isAvailable;

  const availableVariants = variantData?.variantInfo.filter(v => v.isAvailable) || [];
  const outOfStockVariants = variantData?.variantInfo.filter(v => !v.isAvailable) || [];

  return {
    productAvailability,
    ...(variantAvailability && { variantAvailability }),
    availabilityChanged,
    isSelectedVariantAvailable,
    availableVariants,
    outOfStockVariants
  };
}

/**
 * Hook for bulk inventory status
 * Optimized for product grids and catalog displays
 */
export function useBulkInventoryStatus(
  products: ProductListItem[],
  options: Partial<InventoryThresholds> = {}
): Map<string, InventoryStatus> {
  return useMemo(() => {
    const inventoryMap = new Map<string, InventoryStatus>();
    
    for (const product of products) {
      try {
        const inventory = calculateInventoryStatus(product, options);
        inventoryMap.set(product.id, inventory);
      } catch (_error) {

        
        // Fallback inventory status
        inventoryMap.set(product.id, {
          status: 'out_of_stock',
          totalQuantity: 0,
          isNew: false,
          isOnSale: false,
          showBadge: null,
          badgeColor: null,
          isAvailable: false,
          stockLevel: 'none',
          daysOld: 0
        });
      }
    }
    
    return inventoryMap;
  }, [products, options]);
}

// =============================================================================
// BADGE AND STATUS HOOKS
// =============================================================================

/**
 * Hook for badge display logic
 * Provides badge configuration and display rules
 */
export function useProductBadge(
  product: ProductListItem,
  options: UseInventoryStatusOptions = {}
): {
  badge: ReturnType<typeof getBadgeConfig>;
  shouldShowBadge: boolean;
  badgeText: string | null;
  badgeColor: string | null;
  badgePriority: number; // Higher numbers = higher priority
} {
  const { inventory } = useInventoryStatus(product, options);
  const badge = getBadgeConfig(inventory);

  const badgePriority = useMemo(() => {
    if (!inventory.showBadge) return 0;
    
    // Priority order: Sale > New > Low Stock
    switch (inventory.showBadge) {
      case 'Sale': return 3;
      case 'New': return 2;
      case 'Low Stock': return 1;
      default: return 0;
    }
  }, [inventory.showBadge]);

  return {
    badge,
    shouldShowBadge: !!badge,
    badgeText: inventory.showBadge,
    badgeColor: inventory.badgeColor,
    badgePriority
  };
}

/**
 * Hook for stock level indicators
 * Provides consistent stock level messaging
 */
export function useStockLevelIndicator(
  product: ProductListItem,
  selectedVariantId?: string,
  variants: ProductVariant[] = []
): {
  stockLevel: 'high' | 'medium' | 'low' | 'none';
  stockText: string;
  stockColor: 'green' | 'yellow' | 'red' | 'gray';
  showQuantity: boolean;
  exactQuantity?: number;
} {
  const { inventory, selectedVariantInventory } = useInventoryStatus(product, {
    variants,
    selectedVariantId
  });

  const effectiveInventory = selectedVariantInventory || inventory;
  const stockLevel = selectedVariantInventory?.stockLevel || inventory.stockLevel;
  
  const stockColor = useMemo(() => {
    switch (stockLevel) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      case 'none': return 'gray';
      default: return 'gray';
    }
  }, [stockLevel]);

  const showQuantity = stockLevel === 'low' || (selectedVariantInventory ? selectedVariantInventory.quantity <= 10 : false);
  const exactQuantity = selectedVariantInventory?.quantity || inventory.totalQuantity;

  return {
    stockLevel,
    stockText: getStockLevelText(inventory, showQuantity),
    stockColor,
    showQuantity,
    exactQuantity
  };
}

// =============================================================================
// FILTERING AND SORTING HOOKS
// =============================================================================

/**
 * Hook for inventory-based product filtering
 * Provides filtering functions for product catalogs
 */
export function useInventoryFilter(): {
  filterByAvailability: (products: ProductListItem[], filterType: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => ProductListItem[];
  filterByNewProducts: (products: ProductListItem[], days?: number) => ProductListItem[];
  filterBySaleProducts: (products: ProductListItem[]) => ProductListItem[];
} {
  const filterByAvailability = useMemo(() => {
    return (products: ProductListItem[], filterType: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => {
      if (filterType === 'all') return products;

      return products.filter(product => {
        const inventory = calculateInventoryStatus(product);
        
        switch (filterType) {
          case 'in_stock':
            return inventory.status === 'in_stock';
          case 'low_stock':
            return inventory.status === 'low_stock';
          case 'out_of_stock':
            return inventory.status === 'out_of_stock';
          default:
            return true;
        }
      });
    };
  }, []);

  const filterByNewProducts = useMemo(() => {
    return (products: ProductListItem[], days: number = 30) => {
      return products.filter(product => {
        const inventory = calculateInventoryStatus(product, { newProductDays: days });
        return inventory.isNew;
      });
    };
  }, []);

  const filterBySaleProducts = useMemo(() => {
    return (products: ProductListItem[]) => {
      return products.filter(product => {
        const inventory = calculateInventoryStatus(product);
        return inventory.isOnSale;
      });
    };
  }, []);

  return {
    filterByAvailability,
    filterByNewProducts,
    filterBySaleProducts
  };
}

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export default useInventoryStatus;