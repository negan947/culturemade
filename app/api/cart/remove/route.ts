import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { removeFromCartSchema } from '@/lib/validations/ecommerce'
import type { ApiResponse } from '@/types/ecommerce'

/**
 * DELETE /api/cart/remove - Remove item from cart
 * 
 * Body:
 * {
 *   "cartItemId": "uuid"
 * }
 * 
 * Authentication: Optional (supports both logged-in users and guest sessions)
 * 
 * Features:
 * - User/session ownership validation
 * - Soft error handling (succeeds even if item doesn't exist)
 * - Clean removal without affecting other cart items
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = removeFromCartSchema.parse(body)
    
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
    
    // Build delete query with ownership validation
    let deleteQuery = supabase
      .from('cart_items')
      .delete()
      .eq('id', validatedData.cartItemId)
    
    // Filter by user or session ownership
    if (user) {
      deleteQuery = deleteQuery.eq('user_id', user.id)
    } else {
      deleteQuery = deleteQuery.eq('session_id', sessionId!)
    }
    
    const { error: deleteError, count } = await deleteQuery
    
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
    
    // Return success regardless of whether item existed
    // This provides idempotent behavior for the client
    const response: ApiResponse = {
      success: true,
      data: null,
      meta: {
        action: 'removed',
        itemsDeleted: count || 0,
        message: count && count > 0 ? 'Item removed from cart' : 'Item was not in cart'
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Remove from cart API error:', error)
    
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
        message: 'Failed to remove item from cart'
      }
    }, { status: 500 })
  }
} 