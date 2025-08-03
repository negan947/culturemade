/**
 * Inventory Utilities for CultureMade ProductCard System
 * 
 * Provides comprehensive inventory status determination and badge logic
 * for real-time stock indicators and product availability management.
 */

import { ProductListItem, ProductVariant } from '@/types/api';

// =============================================================================
// INVENTORY INTERFACES
// =============================================================================

export interface InventoryStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalQuantity: number;
  isNew: boolean;
  isOnSale: boolean;
  showBadge: string | null;     // "Sale", "New", "Low Stock", null
  badgeColor: 'red' | 'orange' | 'green' | 'blue' | null;
  isAvailable: boolean;         // false for out of stock
  stockLevel: 'high' | 'medium' | 'low' | 'none';
  daysOld: number;             // days since created_at
}

export interface InventoryThresholds {
  lowStockThreshold: number;    // default: 5
  newProductDays: number;       // default: 30
  outOfStockThreshold: number;  // default: 0
}

export interface VariantInventoryInfo {
  variantId: string;
  quantity: number;
  isAvailable: boolean;
  stockLevel: 'high' | 'medium' | 'low' | 'none';
}

// =============================================================================
// CORE INVENTORY CALCULATIONS
// =============================================================================

/**
 * Calculate comprehensive inventory status from product data
 * Handles out of stock, low stock, new product badges
 */
export function calculateInventoryStatus(
  product: ProductListItem,
  thresholds: Partial<InventoryThresholds> = {}
): InventoryStatus {
  const {
    lowStockThreshold = 5,
    newProductDays = 30,
    outOfStockThreshold = 0
  } = thresholds;

  // Get total inventory from product metadata
  const totalQuantity = product.total_inventory || 0;
  
  // Calculate days since creation
  const createdAt = new Date(product.created_at);
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine stock status
  let status: 'in_stock' | 'low_stock' | 'out_of_stock';
  let stockLevel: 'high' | 'medium' | 'low' | 'none';
  
  if (totalQuantity <= outOfStockThreshold) {
    status = 'out_of_stock';
    stockLevel = 'none';
  } else if (totalQuantity <= lowStockThreshold) {
    status = 'low_stock';
    stockLevel = 'low';
  } else {
    status = 'in_stock';
    stockLevel = totalQuantity <= lowStockThreshold * 2 ? 'medium' : 'high';
  }

  // Determine if product is new
  const isNew = daysOld <= newProductDays;
  
  // Determine if product is on sale
  const isOnSale = !!(product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price));
  
  // Determine badge display priority (sale > new > low stock > none)
  let showBadge: string | null = null;
  let badgeColor: 'red' | 'orange' | 'green' | 'blue' | null = null;
  
  if (status === 'out_of_stock') {
    // Don't show badges for out of stock items (handled by UI state)
    showBadge = null;
    badgeColor = null;
  } else if (isOnSale) {
    showBadge = 'Sale';
    badgeColor = 'red';
  } else if (isNew) {
    showBadge = 'New';
    badgeColor = 'blue';
  } else if (status === 'low_stock') {
    showBadge = 'Low Stock';
    badgeColor = 'orange';
  }

  return {
    status,
    totalQuantity,
    isNew,
    isOnSale,
    showBadge,
    badgeColor,
    isAvailable: status !== 'out_of_stock',
    stockLevel,
    daysOld
  };
}

/**
 * Calculate inventory status for specific product variants
 * Used when displaying variant-specific availability
 */
export function calculateVariantInventory(
  variants: ProductVariant[],
  thresholds: Partial<InventoryThresholds> = {}
): {
  totalQuantity: number;
  variantInfo: VariantInventoryInfo[];
  overallStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableVariants: number;
} {
  const { lowStockThreshold = 5 } = thresholds;

  if (!variants.length) {
    return {
      totalQuantity: 0,
      variantInfo: [],
      overallStatus: 'out_of_stock',
      availableVariants: 0
    };
  }

  let totalQuantity = 0;
  let availableVariants = 0;
  const variantInfo: VariantInventoryInfo[] = [];

  // Process each variant
  for (const variant of variants) {
    const quantity = variant.quantity || 0;
    totalQuantity += quantity;

    const isAvailable = quantity > 0;
    if (isAvailable) availableVariants++;

    let stockLevel: 'high' | 'medium' | 'low' | 'none';
    if (quantity === 0) {
      stockLevel = 'none';
    } else if (quantity <= lowStockThreshold) {
      stockLevel = 'low';
    } else if (quantity <= lowStockThreshold * 2) {
      stockLevel = 'medium';
    } else {
      stockLevel = 'high';
    }

    variantInfo.push({
      variantId: variant.id,
      quantity,
      isAvailable,
      stockLevel
    });
  }

  // Determine overall status
  let overallStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  if (totalQuantity === 0) {
    overallStatus = 'out_of_stock';
  } else if (totalQuantity <= lowStockThreshold || availableVariants === 0) {
    overallStatus = 'low_stock';
  } else {
    overallStatus = 'in_stock';
  }

  return {
    totalQuantity,
    variantInfo,
    overallStatus,
    availableVariants
  };
}

// =============================================================================
// BADGE AND STATUS UTILITIES
// =============================================================================

/**
 * Get appropriate badge configuration for inventory status
 * Returns null if no badge should be displayed
 */
export function getBadgeConfig(inventoryStatus: InventoryStatus): {
  text: string;
  color: string;
  bgColor: string;
  textColor: string;
} | null {
  if (!inventoryStatus.showBadge) return null;

  const badgeConfigs = {
    'Sale': {
      text: 'Sale',
      color: 'red',
      bgColor: 'bg-red-500',
      textColor: 'text-white'
    },
    'New': {
      text: 'New',
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-white'
    },
    'Low Stock': {
      text: 'Low Stock',
      color: 'orange',
      bgColor: 'bg-orange-500',
      textColor: 'text-white'
    }
  };

  return badgeConfigs[inventoryStatus.showBadge as keyof typeof badgeConfigs] || null;
}

/**
 * Get CSS classes for product card based on inventory status
 * Handles opacity, overlays, and disabled states
 */
export function getInventoryCardClasses(inventoryStatus: InventoryStatus): {
  cardClasses: string;
  imageClasses: string;
  overlayClasses: string;
  showOverlay: boolean;
} {
  const isOutOfStock = inventoryStatus.status === 'out_of_stock';
  
  return {
    cardClasses: isOutOfStock 
      ? 'opacity-60 pointer-events-none' 
      : 'opacity-100',
    imageClasses: isOutOfStock 
      ? 'grayscale opacity-50' 
      : '',
    overlayClasses: isOutOfStock 
      ? 'absolute inset-0 bg-gray-900/20 flex items-center justify-center' 
      : '',
    showOverlay: isOutOfStock
  };
}

/**
 * Generate stock level indicator text for UI display
 * Provides user-friendly stock level messaging
 */
export function getStockLevelText(
  inventoryStatus: InventoryStatus,
  showExactQuantity: boolean = false
): string {
  const { status, totalQuantity, stockLevel } = inventoryStatus;

  if (status === 'out_of_stock') {
    return 'Out of Stock';
  }

  if (showExactQuantity) {
    const itemText = totalQuantity === 1 ? 'item' : 'items';
    return `${totalQuantity} ${itemText} left`;
  }

  switch (stockLevel) {
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

// =============================================================================
// INVENTORY FILTERING UTILITIES
// =============================================================================

/**
 * Filter products by availability status
 * Used for catalog filtering and search
 */
export function filterByAvailability(
  products: ProductListItem[],
  filterType: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_sale' | 'new',
  thresholds: Partial<InventoryThresholds> = {}
): ProductListItem[] {
  if (filterType === 'all') return products;

  return products.filter(product => {
    const inventory = calculateInventoryStatus(product, thresholds);
    
    switch (filterType) {
      case 'in_stock':
        return inventory.status === 'in_stock';
      case 'low_stock':
        return inventory.status === 'low_stock';
      case 'out_of_stock':
        return inventory.status === 'out_of_stock';
      case 'on_sale':
        return inventory.isOnSale;
      case 'new':
        return inventory.isNew;
      default:
        return true;
    }
  });
}

/**
 * Sort products by inventory priority
 * Prioritizes in-stock items, then low stock, then out of stock
 */
export function sortByInventoryPriority(
  products: ProductListItem[],
  thresholds: Partial<InventoryThresholds> = {}
): ProductListItem[] {
  return [...products].sort((a, b) => {
    const inventoryA = calculateInventoryStatus(a, thresholds);
    const inventoryB = calculateInventoryStatus(b, thresholds);
    
    // Priority order: in_stock > low_stock > out_of_stock
    const priorityMap = { 'in_stock': 3, 'low_stock': 2, 'out_of_stock': 1 };
    const priorityA = priorityMap[inventoryA.status];
    const priorityB = priorityMap[inventoryB.status];
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    
    // If same status, sort by quantity (higher first)
    return inventoryB.totalQuantity - inventoryA.totalQuantity;
  });
}

// =============================================================================
// BULK INVENTORY UTILITIES
// =============================================================================

/**
 * Calculate inventory status for multiple products efficiently
 * Optimized for performance with large product catalogs
 */
export function calculateBulkInventoryStatus(
  products: ProductListItem[],
  thresholds: Partial<InventoryThresholds> = {}
): Map<string, InventoryStatus> {
  const inventoryMap = new Map<string, InventoryStatus>();
  
  for (const product of products) {
    try {
      const inventoryStatus = calculateInventoryStatus(product, thresholds);
      inventoryMap.set(product.id, inventoryStatus);
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
}

// =============================================================================
// INVENTORY VALIDATION UTILITIES
// =============================================================================

/**
 * Validate inventory data for consistency and business rules
 * Ensures inventory data meets business requirements
 */
export function validateInventoryData(product: ProductListItem): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const totalInventory = product.total_inventory;
  
  // Basic inventory validation
  if (typeof totalInventory !== 'number' || totalInventory < 0) {
    errors.push('Total inventory must be a non-negative number');
  }
  
  if (totalInventory === 0 && product.status === 'active') {
    warnings.push('Product is active but has zero inventory');
  }
  
  // Date validation
  try {
    const createdAt = new Date(product.created_at);
    if (isNaN(createdAt.getTime())) {
      errors.push('Invalid created_at date format');
    }
    
    const now = new Date();
    if (createdAt > now) {
      warnings.push('Product created_at is in the future');
    }
  } catch (_error) {
    errors.push('Failed to parse created_at date');
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

export const InventoryUtils = {
  calculate: calculateInventoryStatus,
  calculateVariant: calculateVariantInventory,
  getBadge: getBadgeConfig,
  getCardClasses: getInventoryCardClasses,
  getStockText: getStockLevelText,
  filterByAvailability,
  sortByPriority: sortByInventoryPriority,
  calculateBulk: calculateBulkInventoryStatus,
  validate: validateInventoryData,
} as const;

export default InventoryUtils;