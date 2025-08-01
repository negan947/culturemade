import { checkVariantAvailability } from './productVariantUtils';
import { validateQuantity } from './quantityUtils';

// Note: This utility file demonstrates cart logic structure
// In actual implementation, SQL queries should be executed via MCP tools
// at the application level (API routes or server components)

export interface CartItem {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Expanded fields from joins
  product_name?: string;
  product_image?: string;
  variant_name?: string;
  variant_price?: number;
  variant_sku?: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  hasLowStockItems: boolean;
  hasOutOfStockItems: boolean;
}

export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
}

export interface AddToCartResponse {
  success: boolean;
  cartItem?: CartItem;
  cart?: CartSummary;
  errors?: string[];
  warnings?: string[];
}

export interface CartValidation {
  isValid: boolean;
  invalidItems: Array<{
    cartItemId: string;
    variantId: string;
    issue: string;
    maxAvailable: number;
  }>;
  warnings: string[];
}

/**
 * Add item to cart with inventory validation
 */
export async function addToCart(request: AddToCartRequest): Promise<AddToCartResponse> {
  try {
    // Validate variant exists and has inventory
    const availability = await checkVariantAvailability(request.variantId);
    if (!availability.is_available) {
      return {
        success: false,
        errors: ['This item is out of stock']
      };
    }

    // Validate quantity
    const quantityValidation = await validateQuantity(request.variantId, request.quantity);
    if (!quantityValidation.isValid) {
      return {
        success: false,
        errors: quantityValidation.errors,
        warnings: quantityValidation.warnings
      };
    }

    // Check for existing cart item
    const existingQuery = `
      SELECT id, quantity FROM cart_items
      WHERE variant_id = '${request.variantId}'
      AND ${request.userId ? `user_id = '${request.userId}'` : `session_id = '${request.sessionId}'`};
    `;

    // This would be called via MCP at the application level
    // const existingResult = await mcp__supabasecm__execute_sql({ query: existingQuery });
    throw new Error('MCP integration required - call mcp__supabasecm__execute_sql with this query: ' + existingQuery);
    let existingItems: any[] = [];
    
    if (existingResult && typeof existingResult === 'string') {
      try {
        existingItems = JSON.parse(existingResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      } catch (e) {
        existingItems = [];
      }
    }

    let cartItem: CartItem;
    
    if (existingItems.length > 0) {
      // Update existing cart item
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + request.quantity;
      
      // Validate new total quantity
      const newQuantityValidation = await validateQuantity(request.variantId, newQuantity);
      if (!newQuantityValidation.isValid) {
        return {
          success: false,
          errors: newQuantityValidation.errors,
          warnings: newQuantityValidation.warnings
        };
      }

      const updateQuery = `
        UPDATE cart_items 
        SET quantity = ${newQuantity}, updated_at = NOW()
        WHERE id = '${existingItem.id}'
        RETURNING *;
      `;

      // This would be called via MCP at the application level
      // const updateResult = await mcp__supabasecm__execute_sql({ query: updateQuery });
      throw new Error('MCP integration required - call mcp__supabasecm__execute_sql with this query: ' + updateQuery);
      const updatedItems = JSON.parse(updateResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      cartItem = updatedItems[0];

    } else {
      // Create new cart item
      const insertQuery = `
        INSERT INTO cart_items (
          user_id, 
          session_id, 
          product_id, 
          variant_id, 
          quantity
        ) VALUES (
          ${request.userId ? `'${request.userId}'` : 'NULL'},
          ${request.sessionId ? `'${request.sessionId}'` : 'NULL'},
          '${request.productId}',
          '${request.variantId}',
          ${request.quantity}
        )
        RETURNING *;
      `;

      // This would be called via MCP at the application level
      // const insertResult = await mcp__supabasecm__execute_sql({ query: insertQuery });
      throw new Error('MCP integration required - call mcp__supabasecm__execute_sql with this query: ' + insertQuery);
      const newItems = JSON.parse(insertResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      cartItem = newItems[0];
    }

    // Get updated cart summary
    const cart = await getCartSummary(request.userId, request.sessionId);

    return {
      success: true,
      cartItem,
      cart,
      warnings: quantityValidation.warnings
    };

  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      errors: ['Failed to add item to cart. Please try again.']
    };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  newQuantity: number,
  userId?: string,
  sessionId?: string
): Promise<AddToCartResponse> {
  try {
    if (newQuantity <= 0) {
      return await removeCartItem(cartItemId, userId, sessionId);
    }

    // Get cart item details
    const itemQuery = `
      SELECT * FROM cart_items WHERE id = '${cartItemId}'
      AND ${userId ? `user_id = '${userId}'` : `session_id = '${sessionId}'`};
    `;

    const itemResult = await mcp__supabasecm__execute_sql({ query: itemQuery });
    const items = JSON.parse(itemResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
    
    if (items.length === 0) {
      return {
        success: false,
        errors: ['Cart item not found']
      };
    }

    const cartItem = items[0];

    // Validate new quantity
    const quantityValidation = await validateQuantity(cartItem.variant_id, newQuantity);
    if (!quantityValidation.isValid) {
      return {
        success: false,
        errors: quantityValidation.errors,
        warnings: quantityValidation.warnings
      };
    }

    // Update quantity
    const updateQuery = `
      UPDATE cart_items 
      SET quantity = ${newQuantity}, updated_at = NOW()
      WHERE id = '${cartItemId}'
      RETURNING *;
    `;

    const updateResult = await mcp__supabasecm__execute_sql({ query: updateQuery });
    const updatedItems = JSON.parse(updateResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);

    const cart = await getCartSummary(userId, sessionId);

    return {
      success: true,
      cartItem: updatedItems[0],
      cart,
      warnings: quantityValidation.warnings
    };

  } catch (error) {
    console.error('Error updating cart item:', error);
    return {
      success: false,
      errors: ['Failed to update cart item. Please try again.']
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  cartItemId: string,
  userId?: string,
  sessionId?: string
): Promise<AddToCartResponse> {
  try {
    const deleteQuery = `
      DELETE FROM cart_items 
      WHERE id = '${cartItemId}'
      AND ${userId ? `user_id = '${userId}'` : `session_id = '${sessionId}'`};
    `;

    await mcp__supabasecm__execute_sql({ query: deleteQuery });

    const cart = await getCartSummary(userId, sessionId);

    return {
      success: true,
      cart
    };

  } catch (error) {
    console.error('Error removing cart item:', error);
    return {
      success: false,
      errors: ['Failed to remove cart item. Please try again.']
    };
  }
}

/**
 * Get cart summary with calculated totals
 */
export async function getCartSummary(userId?: string, sessionId?: string): Promise<CartSummary> {
  try {
    const query = `
      SELECT 
        ci.*,
        p.name as product_name,
        pi.url as product_image,
        pv.name as variant_name,
        pv.price as variant_price,
        pv.sku as variant_sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN product_variants pv ON ci.variant_id = pv.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.position = 1
      WHERE ${userId ? `ci.user_id = '${userId}'` : `ci.session_id = '${sessionId}'`}
      ORDER BY ci.created_at ASC;
    `;

    const result = await mcp__supabasecm__execute_sql({ query });
    let items: CartItem[] = [];

    if (result && typeof result === 'string') {
      try {
        items = JSON.parse(result.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      } catch (e) {
        items = [];
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.variant_price?.toString() || '0') * item.quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 75 ? 0 : 10; // Free shipping over $75
    const total = subtotal + tax + shipping;

    // Check for stock issues
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const availability = await checkVariantAvailability(item.variant_id);
        return {
          item,
          available: availability.is_available,
          lowStock: availability.is_low_stock
        };
      })
    );

    const hasOutOfStockItems = stockChecks.some(check => !check.available);
    const hasLowStockItems = stockChecks.some(check => check.lowStock);

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      shipping,
      total,
      hasLowStockItems,
      hasOutOfStockItems
    };

  } catch (error) {
    console.error('Error getting cart summary:', error);
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      hasLowStockItems: false,
      hasOutOfStockItems: false
    };
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(userId?: string, sessionId?: string): Promise<boolean> {
  try {
    const deleteQuery = `
      DELETE FROM cart_items 
      WHERE ${userId ? `user_id = '${userId}'` : `session_id = '${sessionId}'`};
    `;

    await mcp__supabasecm__execute_sql({ query: deleteQuery });
    return true;

  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
}

/**
 * Validate entire cart before checkout
 */
export async function validateCart(userId?: string, sessionId?: string): Promise<CartValidation> {
  try {
    const cart = await getCartSummary(userId, sessionId);
    const invalidItems: CartValidation['invalidItems'] = [];
    const warnings: string[] = [];

    // Check each item
    for (const item of cart.items) {
      const availability = await checkVariantAvailability(item.variant_id);
      
      if (!availability.is_available) {
        invalidItems.push({
          cartItemId: item.id,
          variantId: item.variant_id,
          issue: 'Out of stock',
          maxAvailable: 0
        });
      } else if (item.quantity > availability.available_quantity) {
        invalidItems.push({
          cartItemId: item.id,
          variantId: item.variant_id,
          issue: `Only ${availability.available_quantity} available`,
          maxAvailable: availability.available_quantity
        });
      } else if (availability.is_low_stock) {
        warnings.push(`${item.product_name} (${item.variant_name}) is low in stock`);
      }
    }

    return {
      isValid: invalidItems.length === 0,
      invalidItems,
      warnings
    };

  } catch (error) {
    console.error('Error validating cart:', error);
    return {
      isValid: false,
      invalidItems: [],
      warnings: ['Unable to validate cart items']
    };
  }
}

/**
 * Merge guest cart with user cart on login
 */
export async function mergeGuestCart(guestSessionId: string, userId: string): Promise<boolean> {
  try {
    // Get guest cart items
    const guestQuery = `
      SELECT * FROM cart_items WHERE session_id = '${guestSessionId}';
    `;

    const guestResult = await mcp__supabasecm__execute_sql({ query: guestQuery });
    let guestItems: CartItem[] = [];

    if (guestResult && typeof guestResult === 'string') {
      try {
        guestItems = JSON.parse(guestResult.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      } catch (e) {
        guestItems = [];
      }
    }

    if (guestItems.length === 0) return true;

    // For each guest item, try to add to user cart
    for (const item of guestItems) {
      await addToCart({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        userId
      });
    }

    // Clear guest cart
    await clearCart(undefined, guestSessionId);

    return true;

  } catch (error) {
    console.error('Error merging guest cart:', error);
    return false;
  }
}

/**
 * Get cart item count for display
 */
export async function getCartItemCount(userId?: string, sessionId?: string): Promise<number> {
  try {
    const query = `
      SELECT SUM(quantity) as total_items
      FROM cart_items
      WHERE ${userId ? `user_id = '${userId}'` : `session_id = '${sessionId}'`};
    `;

    const result = await mcp__supabasecm__execute_sql({ query });
    
    if (result && typeof result === 'string') {
      const data = JSON.parse(result.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
      return parseInt(data[0]?.total_items || '0');
    }

    return 0;

  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
}

/**
 * Format currency for display
 */
export function formatCartCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Calculate shipping cost based on cart total
 */
export function calculateShipping(subtotal: number): number {
  if (subtotal >= 75) return 0; // Free shipping over $75
  if (subtotal >= 25) return 5;  // Reduced shipping over $25
  return 10; // Standard shipping
}

/**
 * Calculate tax based on subtotal
 */
export function calculateTax(subtotal: number, taxRate: number = 0.08): number {
  return subtotal * taxRate;
}