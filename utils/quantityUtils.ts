import { ProductVariant, checkVariantAvailability } from './productVariantUtils';

export interface QuantityValidation {
  isValid: boolean;
  maxQuantity: number;
  errors: string[];
  warnings: string[];
}

export interface QuantityConstraints {
  minQuantity: number;
  maxQuantity: number;
  lowStockThreshold: number;
  defaultQuantity: number;
}

export interface QuantityState {
  quantity: number;
  maxAllowed: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockRemaining: number;
  warnings: string[];
  errors: string[];
}

/**
 * Default quantity constraints for the business
 */
export const DEFAULT_QUANTITY_CONSTRAINTS: QuantityConstraints = {
  minQuantity: 1,
  maxQuantity: 999,
  lowStockThreshold: 5,
  defaultQuantity: 1
};

/**
 * Validate quantity against variant inventory
 */
export async function validateQuantity(
  variantId: string,
  requestedQuantity: number,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): Promise<QuantityValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check basic quantity constraints
    if (requestedQuantity < constraints.minQuantity) {
      errors.push(`Minimum quantity is ${constraints.minQuantity}`);
    }

    if (requestedQuantity > constraints.maxQuantity) {
      errors.push(`Maximum quantity is ${constraints.maxQuantity}`);
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      errors.push('Quantity must be a positive integer');
    }

    // Check inventory availability
    const availability = await checkVariantAvailability(variantId);

    if (!availability.is_available) {
      errors.push('This item is out of stock');
      return {
        isValid: false,
        maxQuantity: 0,
        errors,
        warnings
      };
    }

    const maxAvailable = availability.available_quantity;

    if (requestedQuantity > maxAvailable) {
      errors.push(`Only ${maxAvailable} items available`);
    }

    // Add low stock warnings
    if (availability.is_low_stock) {
      warnings.push(`Only ${maxAvailable} items left in stock`);
    }

    if (requestedQuantity > (maxAvailable - 2) && maxAvailable > 2) {
      warnings.push('You\'re taking most of the remaining stock');
    }

    return {
      isValid: errors.length === 0,
      maxQuantity: Math.min(maxAvailable, constraints.maxQuantity),
      errors,
      warnings
    };

  } catch (error) {
    console.error('Error validating quantity:', error);
    return {
      isValid: false,
      maxQuantity: 0,
      errors: ['Unable to validate quantity. Please try again.'],
      warnings
    };
  }
}

/**
 * Get quantity state for a variant
 */
export async function getQuantityState(
  variantId: string,
  currentQuantity: number = DEFAULT_QUANTITY_CONSTRAINTS.defaultQuantity,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): Promise<QuantityState> {
  try {
    const availability = await checkVariantAvailability(variantId);
    const validation = await validateQuantity(variantId, currentQuantity, constraints);

    const maxAllowed = Math.min(availability.available_quantity, constraints.maxQuantity);
    const isLowStock = availability.is_low_stock;
    const isOutOfStock = !availability.is_available;

    return {
      quantity: Math.max(constraints.minQuantity, Math.min(currentQuantity, maxAllowed)),
      maxAllowed,
      isLowStock,
      isOutOfStock,
      stockRemaining: availability.available_quantity,
      warnings: validation.warnings,
      errors: validation.errors
    };

  } catch (error) {
    console.error('Error getting quantity state:', error);
    
    return {
      quantity: constraints.defaultQuantity,
      maxAllowed: 0,
      isLowStock: false,
      isOutOfStock: true,
      stockRemaining: 0,
      warnings: [],
      errors: ['Unable to check stock availability']
    };
  }
}

/**
 * Calculate quantity limits based on variant availability
 */
export function calculateQuantityLimits(
  variant: ProductVariant,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): { min: number; max: number; default: number } {
  const available = Math.max(0, variant.quantity);
  
  return {
    min: constraints.minQuantity,
    max: Math.min(available, constraints.maxQuantity),
    default: available > 0 ? constraints.defaultQuantity : 0
  };
}

/**
 * Generate quantity options for a dropdown/selector
 */
export function generateQuantityOptions(
  maxQuantity: number,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): Array<{ value: number; label: string; disabled?: boolean }> {
  const options: Array<{ value: number; label: string; disabled?: boolean }> = [];
  
  const effectiveMax = Math.min(maxQuantity, constraints.maxQuantity);
  
  for (let i = constraints.minQuantity; i <= effectiveMax; i++) {
    options.push({
      value: i,
      label: i.toString(),
      disabled: i > maxQuantity
    });
  }

  // Add "10+" option if max is greater than 10
  if (effectiveMax > 10) {
    options.splice(10, options.length - 10, {
      value: effectiveMax,
      label: `${effectiveMax} (max)`,
      disabled: effectiveMax === 0
    });
  }

  return options;
}

/**
 * Handle quantity increment with bounds checking
 */
export function incrementQuantity(
  currentQuantity: number,
  maxQuantity: number,
  step: number = 1,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): number {
  const newQuantity = currentQuantity + step;
  const effectiveMax = Math.min(maxQuantity, constraints.maxQuantity);
  
  return Math.min(newQuantity, effectiveMax);
}

/**
 * Handle quantity decrement with bounds checking
 */
export function decrementQuantity(
  currentQuantity: number,
  step: number = 1,
  constraints: QuantityConstraints = DEFAULT_QUANTITY_CONSTRAINTS
): number {
  const newQuantity = currentQuantity - step;
  
  return Math.max(newQuantity, constraints.minQuantity);
}

/**
 * Validate multiple cart items quantities
 */
export async function validateCartQuantities(
  cartItems: Array<{ variantId: string; quantity: number }>
): Promise<Array<{ variantId: string; validation: QuantityValidation }>> {
  const validations = await Promise.all(
    cartItems.map(async (item) => ({
      variantId: item.variantId,
      validation: await validateQuantity(item.variantId, item.quantity)
    }))
  );

  return validations;
}

/**
 * Get quantity display text for UI
 */
export function getQuantityDisplayText(quantityState: QuantityState): string {
  if (quantityState.isOutOfStock) {
    return 'Out of Stock';
  }

  if (quantityState.isLowStock) {
    return `Only ${quantityState.stockRemaining} left`;
  }

  if (quantityState.stockRemaining <= 10) {
    return `${quantityState.stockRemaining} in stock`;
  }

  return 'In Stock';
}

/**
 * Get quantity warning message
 */
export function getQuantityWarningMessage(quantityState: QuantityState): string | null {
  if (quantityState.errors.length > 0) {
    return quantityState.errors[0] || null;
  }

  if (quantityState.warnings.length > 0) {
    return quantityState.warnings[0] || null;
  }

  return null;
}

/**
 * Business rule: Check if quantity requires confirmation
 */
export function requiresQuantityConfirmation(
  quantity: number,
  stockRemaining: number
): boolean {
  // Require confirmation if taking more than 50% of remaining stock
  const percentageOfStock = (quantity / stockRemaining) * 100;
  return percentageOfStock > 50 && stockRemaining <= 10;
}

/**
 * Get quantity selector step size based on available quantity
 */
export function getQuantityStep(maxQuantity: number): number {
  if (maxQuantity <= 10) return 1;
  if (maxQuantity <= 100) return 1;
  return 5; // For large quantities, allow steps of 5
}

/**
 * Format quantity for display
 */
export function formatQuantityDisplay(quantity: number): string {
  if (quantity === 1) return '1 item';
  return `${quantity} items`;
}

/**
 * Parse quantity from user input
 */
export function parseQuantityInput(input: string): number {
  const parsed = parseInt(input.trim(), 10);
  return isNaN(parsed) ? DEFAULT_QUANTITY_CONSTRAINTS.defaultQuantity : parsed;
}