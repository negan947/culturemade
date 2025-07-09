import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { addToCartSchema } from '@/lib/validations/ecommerce'
import type { ApiResponse, CartItem } from '@/types/ecommerce'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/cart/add - Add item to cart
 * 
 * Body:
 * {
 *   "productId": "uuid",
 *   "variantId": "uuid" (optional),
 *   "quantity": number (1-99)
 * }
 * 
 * Authentication: Optional (supports both logged-in users and guest sessions)
 * For guests: Creates or uses session_id from cookie
 * For users: Uses user_id from authentication
 * 
 * Features:
 * - Inventory validation before adding
 * - Duplicate item consolidation (updates quantity if item exists)
 * - Stock availability checking
 * - Session management for guest users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = addToCartSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get user authentication (optional for cart)
    const user = await getUser(supabase)
    
    // Get or create session ID for guest users
    let sessionId = request.cookies.get('cart_session_id')?.value
    if (!user && !sessionId) {
      sessionId = uuidv4()
    }
    
    // Validate product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        status,
        track_quantity,
        quantity,
        allow_backorder,
        product_variants(
          id,
          name,
          price,
          quantity,
          option1,
          option2,
          option3
        )
      `)
      .eq('id', validatedData.productId)
      .eq('status', 'active')
      .single()
    
    if (productError || !product) {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found or unavailable'
        }
      }, { status: 404 })
    }
    
    // Validate variant if specified
    let selectedVariant = null
    if (validatedData.variantId) {
      selectedVariant = product.product_variants?.find(v => v.id === validatedData.variantId)
      if (!selectedVariant) {
        return NextResponse.json<ApiResponse>({
          success: false,
          data: null,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Product variant not found'
          }
        }, { status: 404 })
      }
    }
    
    // Check inventory availability
    const availableStock = selectedVariant?.quantity || product.quantity || 0
    const canBackorder = product.allow_backorder
    
    if (product.track_quantity && !canBackorder && availableStock < validatedData.quantity) {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${availableStock} items available in stock`,
          details: { availableStock }
        }
      }, { status: 400 })
    }
    
    // Check if item already exists in cart
    let existingItemQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_id', validatedData.productId)
    
    if (user) {
      existingItemQuery = existingItemQuery.eq('user_id', user.id)
    } else {
      existingItemQuery = existingItemQuery.eq('session_id', sessionId!)
    }
    
    if (validatedData.variantId) {
      existingItemQuery = existingItemQuery.eq('variant_id', validatedData.variantId)
    } else {
      existingItemQuery = existingItemQuery.is('variant_id', null)
    }
    
    const { data: existingItems } = await existingItemQuery
    const existingItem = existingItems?.[0]
    
    let cartItem
    
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + validatedData.quantity
      
      // Check total quantity against stock
      if (product.track_quantity && !canBackorder && availableStock < newQuantity) {
        return NextResponse.json<ApiResponse>({
          success: false,
          data: null,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Cannot add ${validatedData.quantity} more items. Only ${availableStock - existingItem.quantity} additional items available`,
            details: { 
              availableStock,
              currentCartQuantity: existingItem.quantity,
              requestedQuantity: validatedData.quantity
            }
          }
        }, { status: 400 })
      }
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
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
      
      cartItem = updatedItem
    } else {
      // Create new cart item
      const newCartItem = {
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        product_id: validatedData.productId,
        variant_id: validatedData.variantId || null,
        quantity: validatedData.quantity
      }
      
      const { data: createdItem, error: createError } = await supabase
        .from('cart_items')
        .insert(newCartItem)
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
      
      if (createError) {
        console.error('Cart create error:', createError)
        return NextResponse.json<ApiResponse>({
          success: false,
          data: null,
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to add item to cart'
          }
        }, { status: 500 })
      }
      
      cartItem = createdItem
    }
    
    // Transform cart item with computed properties
    const product_data = cartItem.products
    const variant_data = cartItem.product_variants
    
    const unitPrice = variant_data?.price || product_data.price
    const totalPrice = unitPrice * cartItem.quantity
    
    const transformedCartItem: CartItem = {
      ...cartItem,
      product: product_data,
      variant: variant_data || undefined,
      // Computed properties
      displayName: variant_data?.name || product_data.name,
      unitPrice,
      totalPrice,
      isAvailable: true, // We already validated availability
      stockStatus: availableStock > 10 ? 'in_stock' : availableStock > 0 ? 'low_stock' : 'backorder',
      imageUrl: null, // TODO: Get product image
      variantOptions: variant_data 
        ? [variant_data.option1, variant_data.option2, variant_data.option3].filter(Boolean).join(', ')
        : null
    }
    
    const response: ApiResponse<CartItem> = {
      success: true,
      data: transformedCartItem,
      meta: {
        action: existingItem ? 'updated' : 'added',
        sessionId: !user ? sessionId : undefined
      }
    }
    
    // Set session cookie for guest users
    const headers: Record<string, string> = {}
    if (!user && sessionId) {
      headers['Set-Cookie'] = `cart_session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}` // 30 days
    }
    
    return NextResponse.json(response, { headers })
    
  } catch (error) {
    console.error('Add to cart API error:', error)
    
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
        message: 'Failed to add item to cart'
      }
    }, { status: 500 })
  }
} 