/**
 * Cart Add API Route - Add item to cart
 * This route provides a dedicated endpoint for adding items to cart
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cart/add - Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity, userId, sessionId } = body;

    if (!productId || !variantId || !quantity) {
      return NextResponse.json(
        { error: 'productId, variantId, and quantity are required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, validate that the product variant exists and has inventory
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id, price, quantity, products(id, name)')
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }

    if (variant.quantity < quantity) {
      return NextResponse.json(
        { error: `Only ${variant.quantity} items available in stock` },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_variant_id', variantId)
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check existing cart item: ${checkError.message}`);
    }

    let result;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // Check if new total quantity exceeds available stock
      if (newQuantity > variant.quantity) {
        return NextResponse.json(
          { error: `Cannot add ${quantity} more items. Only ${variant.quantity - existingItem.quantity} can be added (${existingItem.quantity} already in cart)` },
          { status: 400 }
        );
      }

      // Update existing item quantity
      const { data, error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update cart item: ${updateError.message}`);
      }
      result = data;
    } else {
      // Insert new cart item
      const { data, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          product_variant_id: variantId,
          quantity,
          user_id: userId || null,
          session_id: sessionId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to add cart item: ${insertError.message}`);
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: existingItem ? 'Cart item quantity updated' : 'Item added to cart',
      cartItem: result,
      product: {
        id: variant.products.id,
        name: variant.products.name,
        price: variant.price
      }
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

