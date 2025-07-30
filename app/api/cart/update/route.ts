/**
 * Cart Update API Route - Update cart item quantity
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/cart/update - Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, quantity, userId, sessionId } = body;

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'cartItemId is required' },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'quantity is required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If quantity is 0, remove the item
    if (quantity === 0) {
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
        removed: true
      });
    }

    // Get current cart item with variant details
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_variant_id,
        quantity,
        product_variants(
          id,
          quantity,
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

    // Check if requested quantity exceeds available stock
    if (quantity > cartItem.product_variants.quantity) {
      return NextResponse.json(
        { error: `Only ${cartItem.product_variants.quantity} items available in stock` },
        { status: 400 }
      );
    }

    // Update cart item quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartItemId)
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item quantity updated',
      cartItem: data,
      product: {
        id: cartItem.product_variants.products.id,
        name: cartItem.product_variants.products.name
      }
    });

  } catch (error) {
    console.error('Cart update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}