/**
 * Cart Remove API Route - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/cart/remove - Remove item from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, userId, sessionId } = body;

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'cartItemId is required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, verify the cart item exists and belongs to the user/session
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_variants(
          products(id, name)
        )
      `)
      .eq('id', cartItemId)
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
      .single();

    if (fetchError || !cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Remove cart item
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`);

    if (error) {
      throw new Error(`Failed to remove cart item: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item removed',
      removedItem: {
        id: cartItem.id,
        product: cartItem.product_variants.products
      }
    });

  } catch (error) {
    console.error('Cart remove API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart/remove - Alternative POST method for remove (for easier frontend integration)
 */
export async function POST(request: NextRequest) {
  return await DELETE(request);
}