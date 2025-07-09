import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import type { ApiResponse, Cart, CartItem, CartTotals } from '@/types/ecommerce'

/**
 * GET /api/cart - Get current cart state with items and totals
 * 
 * Returns:
 * - All cart items with product and variant details
 * - Calculated totals (subtotal, tax, shipping, total)
 * - Cart metadata (item count, last updated)
 * 
 * Authentication: Optional (supports both logged-in users and guest sessions)
 * For guests: Uses session_id from cookie or query parameter
 * For users: Uses user_id from authentication
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get user authentication (optional for cart)
    const user = await getUser(supabase)
    const sessionId = searchParams.get('sessionId') || request.cookies.get('cart_session_id')?.value
    
    // Must have either user or session ID
    if (!user && !sessionId) {
      return NextResponse.json<ApiResponse<Cart>>({
        success: true,
        data: {
          items: [],
          totals: {
            subtotal: 0,
            taxAmount: 0,
            shippingAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
            itemCount: 0,
            currency: 'USD'
          },
          isLoading: false,
          lastUpdated: null,
          sessionId: null,
          userId: null
        }
      })
    }
    
    // Build cart query
    let cartQuery = supabase
      .from('cart_items')
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
        ),
        product_images!left(
          id,
          url,
          alt_text,
          position
        )
      `)
      .eq('products.status', 'active') // Only active products
      .order('created_at', { ascending: false })
    
    // Filter by user or session
    if (user) {
      cartQuery = cartQuery.eq('user_id', user.id)
    } else if (sessionId) {
      cartQuery = cartQuery.eq('session_id', sessionId)
    }
    
    const { data: cartItems, error } = await cartQuery
    
    if (error) {
      console.error('Cart fetch error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch cart'
        }
      }, { status: 500 })
    }
    
    // Transform cart items with computed properties
    const transformedItems: CartItem[] = (cartItems || []).map(item => {
      const product = item.products
      const variant = item.product_variants
      
      // Calculate effective price (variant price overrides product price)
      const unitPrice = variant?.price || product.price
      const totalPrice = unitPrice * item.quantity
      
      // Calculate stock status
      const availableStock = variant?.quantity || product.product_quantity || 0
      const isAvailable = availableStock >= item.quantity || product.allow_backorder
      
      // Get main product image
      const mainImage = item.product_images?.find(img => img.position === 0) || item.product_images?.[0]
      
      // Build variant options text
      const variantOptions = variant 
        ? [variant.option1, variant.option2, variant.option3].filter(Boolean).join(', ')
        : null
      
      return {
        ...item,
        product,
        variant: variant || undefined,
        // Computed properties
        displayName: variant?.name || product.name,
        unitPrice,
        totalPrice,
        isAvailable,
        stockStatus: availableStock > 10 
          ? 'in_stock' 
          : availableStock >= item.quantity 
            ? 'low_stock' 
            : product.allow_backorder 
              ? 'backorder' 
              : 'out_of_stock',
        imageUrl: mainImage?.url || null,
        variantOptions
      }
    })
    
    // Calculate cart totals
    const subtotal = transformedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const itemCount = transformedItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // TODO: Implement tax calculation based on shipping address
    const taxAmount = 0
    
    // TODO: Implement shipping calculation based on items and address
    const shippingAmount = 0
    
    // TODO: Implement discount calculation based on applied codes
    const discountAmount = 0
    
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount
    
    const totals: CartTotals = {
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      itemCount,
      currency: 'USD'
    }
    
    // Get last updated timestamp
    const lastUpdated = transformedItems.length > 0 
      ? Math.max(...transformedItems.map(item => new Date(item.updated_at).getTime()))
      : null
    
    const cart: Cart = {
      items: transformedItems,
      totals,
      isLoading: false,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      sessionId,
      userId: user?.id || null
    }
    
    const response: ApiResponse<Cart> = {
      success: true,
      data: cart
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate' // Don't cache cart data
      }
    })
    
  } catch (error) {
    console.error('Cart API error:', error)
    
    return NextResponse.json<ApiResponse>({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch cart'
      }
    }, { status: 500 })
  }
} 