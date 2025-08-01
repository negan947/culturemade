/**
 * Checkout Utilities - Pre-checkout validation and inventory handling
 * Provides foundation for Phase 2 checkout implementation
 */

interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  unavailableItems: string[];
  lowStockItems: Array<{
    id: string;
    name: string;
    available: number;
    requested: number;
  }>;
}

interface CheckoutValidationOptions {
  userId?: string;
  sessionId?: string;
  skipInventoryCheck?: boolean;
}

/**
 * Validates cart items before proceeding to checkout
 * Checks inventory availability and identifies conflicts
 */
export async function validateCartForCheckout(
  options: CheckoutValidationOptions = {}
): Promise<CartValidationResult> {
  const { userId, sessionId } = options;
  
  try {
    // Fetch current cart state
    const response = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(userId && { 'x-user-id': userId }),
        ...(sessionId && { 'x-session-id': sessionId })
      }
    });

    if (!response.ok) {
      return {
        isValid: false,
        errors: ['Failed to load cart for validation'],
        warnings: [],
        unavailableItems: [],
        lowStockItems: []
      };
    }

    const cartData = await response.json();
    const { items, summary } = cartData;

    const errors: string[] = [];
    const warnings: string[] = [];
    const unavailableItems: string[] = [];
    const lowStockItems: Array<{
      id: string;
      name: string;
      available: number;
      requested: number;
    }> = [];

    // Validate cart is not empty
    if (!items || items.length === 0) {
      errors.push('Cart is empty');
      return {
        isValid: false,
        errors,
        warnings,
        unavailableItems,
        lowStockItems
      };
    }

    // Validate each cart item
    for (const item of items) {
      // Check if item is available
      if (!item.is_available) {
        unavailableItems.push(item.product_name);
        errors.push(`${item.product_name} is no longer available`);
        continue;
      }

      // Check inventory levels
      if (item.inventory_quantity !== undefined) {
        if (item.inventory_quantity === 0) {
          unavailableItems.push(item.product_name);
          errors.push(`${item.product_name} is out of stock`);
        } else if (item.quantity > item.inventory_quantity) {
          lowStockItems.push({
            id: item.id,
            name: item.product_name,
            available: item.inventory_quantity,
            requested: item.quantity
          });
          errors.push(
            `Only ${item.inventory_quantity} units of ${item.product_name} available (requested ${item.quantity})`
          );
        } else if (item.inventory_quantity <= 5) {
          warnings.push(`${item.product_name} has low stock (${item.inventory_quantity} remaining)`);
        }
      }

      // Validate quantity
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.product_name}`);
      }

      // Validate pricing
      if (!item.price || item.price <= 0) {
        errors.push(`Invalid price for ${item.product_name}`);
      }
    }

    // Validate cart totals
    if (!summary || !summary.total || summary.total <= 0) {
      errors.push('Invalid cart total');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      unavailableItems,
      lowStockItems
    };

  } catch (error) {
    console.error('Cart validation failed:', error);
    return {
      isValid: false,
      errors: ['Failed to validate cart'],
      warnings: [],
      unavailableItems: [],
      lowStockItems: []
    };
  }
}

/**
 * Handles inventory conflicts by updating cart quantities
 * Adjusts quantities to available stock levels
 */
export async function resolveInventoryConflicts(
  conflicts: Array<{
    id: string;
    name: string;
    available: number;
    requested: number;
  }>,
  options: CheckoutValidationOptions = {}
): Promise<{ success: boolean; errors: string[] }> {
  const { userId, sessionId } = options;
  const errors: string[] = [];

  try {
    for (const conflict of conflicts) {
      // Update quantity to available stock
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId }),
          ...(sessionId && { 'x-session-id': sessionId })
        },
        body: JSON.stringify({
          cartItemId: conflict.id,
          quantity: conflict.available
        })
      });

      if (!response.ok) {
        errors.push(`Failed to update quantity for ${conflict.name}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Failed to resolve inventory conflicts:', error);
    return {
      success: false,
      errors: ['Failed to resolve inventory conflicts']
    };
  }
}

/**
 * Removes unavailable items from cart
 */
export async function removeUnavailableItems(
  unavailableItems: string[],
  cartItems: any[],
  options: CheckoutValidationOptions = {}
): Promise<{ success: boolean; errors: string[] }> {
  const { userId, sessionId } = options;
  const errors: string[] = [];

  try {
    for (const itemName of unavailableItems) {
      const cartItem = cartItems.find(item => item.product_name === itemName);
      if (!cartItem) continue;

      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId }),
          ...(sessionId && { 'x-session-id': sessionId })
        },
        body: JSON.stringify({
          cartItemId: cartItem.id,
          quantity: 0
        })
      });

      if (!response.ok) {
        errors.push(`Failed to remove ${itemName} from cart`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Failed to remove unavailable items:', error);
    return {
      success: false,
      errors: ['Failed to remove unavailable items']
    };
  }
}

/**
 * Pre-checkout validation and preparation
 * Comprehensive validation before proceeding to Phase 2 checkout
 */
export async function prepareForCheckout(
  options: CheckoutValidationOptions & {
    autoResolveConflicts?: boolean;
    removeUnavailable?: boolean;
  } = {}
): Promise<{
  canProceed: boolean;
  validationResult: CartValidationResult;
  message: string;
  actions: string[];
}> {
  const { autoResolveConflicts = true, removeUnavailable = true } = options;
  
  let validationResult = await validateCartForCheckout(options);
  const actions: string[] = [];

  // Auto-resolve conflicts if enabled
  if (validationResult.lowStockItems.length > 0 && autoResolveConflicts) {
    const resolveResult = await resolveInventoryConflicts(
      validationResult.lowStockItems,
      options
    );
    
    if (resolveResult.success) {
      actions.push('Adjusted quantities to available stock');
      // Re-validate after changes
      validationResult = await validateCartForCheckout(options);
    }
  }

  // Remove unavailable items if enabled
  if (validationResult.unavailableItems.length > 0 && removeUnavailable) {
    // We need to fetch cart items for removal
    const cartResponse = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.userId && { 'x-user-id': options.userId }),
        ...(options.sessionId && { 'x-session-id': options.sessionId })
      }
    });

    if (cartResponse.ok) {
      const cartData = await cartResponse.json();
      const removeResult = await removeUnavailableItems(
        validationResult.unavailableItems,
        cartData.items,
        options
      );

      if (removeResult.success) {
        actions.push('Removed unavailable items');
        // Re-validate after changes
        validationResult = await validateCartForCheckout(options);
      }
    }
  }

  // Determine if can proceed
  const canProceed = validationResult.isValid;
  
  let message = '';
  if (canProceed) {
    message = 'Cart is ready for checkout';
    if (validationResult.warnings.length > 0) {
      message += ` (${validationResult.warnings.length} warnings)`;
    }
  } else {
    message = `Cannot proceed to checkout: ${validationResult.errors.length} errors found`;
  }

  return {
    canProceed,
    validationResult,
    message,
    actions
  };
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(result: CartValidationResult): string[] {
  const messages: string[] = [];

  // Add error messages
  messages.push(...result.errors);

  // Add warning messages
  if (result.warnings.length > 0) {
    messages.push(...result.warnings.map(warning => `⚠️ ${warning}`));
  }

  return messages;
}

/**
 * Get user-friendly checkout status message
 */
export function getCheckoutStatusMessage(result: CartValidationResult): {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'success';
} {
  if (!result.isValid) {
    return {
      title: 'Cannot proceed to checkout',
      message: `Please resolve ${result.errors.length} issue${result.errors.length === 1 ? '' : 's'} with your cart`,
      severity: 'error'
    };
  }

  if (result.warnings.length > 0) {
    return {
      title: 'Ready to checkout',
      message: `Your cart is ready, but please note ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`,
      severity: 'warning'
    };
  }

  return {
    title: 'Ready to checkout',
    message: 'Your cart looks good! Proceed to secure checkout.',
    severity: 'success'
  };
}