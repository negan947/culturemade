import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { updateCartItemSchema } from '@/lib/validations/ecommerce'
import type { ApiResponse, CartItem } from '@/types/ecommerce'

/**
 * PUT /api/cart/update - Update cart item quantity
 * 
 * Body:
 * {
 *   "cartItemId": "uuid",
 *   "quantity": number (0-99, 0 removes item)
 * }
 * 
 * Authentication: Optional (supports both logged-in users and guest sessions)
 * 
 * Features:
 * - Inventory validation before updating
 * - Automatic item removal when quantity is 0
 * - Stock availability checking
 * - User/session ownership validation
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateCartItemSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get user authentication (optional for cart)
    const user = await getUser(supabase)
    const sessionId = request.cookies.get('cart_session_id')?.value
    
    // Must have either user or session ID
    if (!user && !sessionId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No cart session found'
        }
      }, { status: 401 })
    }
    
    // Get current cart item with product and variant info
    let cartItemQuery = supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        updated_at,
        product_id,
        variant_id,
        products!inner(
          id,
          name,
          slug,
          price,
          compare_at_price,
          status,
          track_quantity,
          quantity as product_quantity,
          allow_backorder
        ),
        product_variants(
          id,
          name,
          price,
          sku,
          quantity,
          option1,
          option2,
          option3
        )
      `)
      .eq('id', validatedData.cartItemId)
    
    // Filter by user or session ownership
    if (user) {
      cartItemQuery = cartItemQuery.eq('user_id', user.id)
    } else {
      cartItemQuery = cartItemQuery.eq('session_id', sessionId!)
    }
    
    const { data: cartItem, error: fetchError } = await cartItemQuery.single()
    
    if (fetchError || !cartItem) {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Cart item not found or access denied'
        }
      }, { status: 404 })
    }
    
    // Check if product is still active
    if (cartItem.products.status !== 'active') {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Product is no longer available'
        }
      }, { status: 400 })
    }
    
    // If quantity is 0, remove the item
    if (validatedData.quantity === 0) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', validatedData.cartItemId)
      
      if (deleteError) {
        console.error('Cart item delete error:', deleteError)
        return NextResponse.json<ApiResponse>({
          success: false,
          data: null,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to remove item from cart'
          }
        }, { status: 500 })
      }
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        meta: {
          action: 'removed',
          message: 'Item removed from cart'
        }
      })
    }
    
    // Validate inventory for new quantity
    const product = cartItem.products
    const variant = cartItem.product_variants
    const availableStock = variant?.quantity || product.product_quantity || 0
    const canBackorder = product.allow_backorder
    
    if (product.track_quantity && !canBackorder && availableStock < validatedData.quantity) {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${availableStock} items available in stock`,
          details: { 
            availableStock,
            requestedQuantity: validatedData.quantity
          }
        }
      }, { status: 400 })
    }
    
    // Update cart item quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity: validatedData.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.cartItemId)
      .select(`
        id,
        quantity,
        created_at,
        updated_at,
        products!inner(
          id,
          name,
          slug,
          price,
          compare_at_price
        ),
        product_variants(
          id,
          name,
          price,
          sku,
          quantity,
          option1,
          option2,
          option3
        )
      `)
      .single()
    
    if (updateError) {
      console.error('Cart update error:', updateError)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update cart item'
        }
      }, { status: 500 })
    }
    
    // Transform cart item with computed properties
    const product_data = updatedItem.products
    const variant_data = updatedItem.product_variants
    
    const unitPrice = variant_data?.price || product_data.price
    const totalPrice = unitPrice * updatedItem.quantity
    
    const transformedCartItem: CartItem = {
      ...updatedItem,
      product: product_data,
      variant: variant_data || undefined,
      // Computed properties
      displayName: variant_data?.name || product_data.name,
      unitPrice,
      totalPrice,
      isAvailable: true, // We already validated availability
      stockStatus: availableStock > 10 
        ? 'in_stock' 
        : availableStock >= validatedData.quantity 
          ? 'low_stock' 
          : canBackorder 
            ? 'backorder' 
            : 'out_of_stock',
      imageUrl: null, // TODO: Get product image
      variantOptions: variant_data 
        ? [variant_data.option1, variant_data.option2, variant_data.option3].filter(Boolean).join(', ')
        : null
    }
    
    const response: ApiResponse<CartItem> = {
      success: true,
      data: transformedCartItem,
      meta: {
        action: 'updated',
        previousQuantity: cartItem.quantity,
        newQuantity: validatedData.quantity
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Update cart API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.message
        }
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update cart item'
      }
    }, { status: 500 })
  }
} 