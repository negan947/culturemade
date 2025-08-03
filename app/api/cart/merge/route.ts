/**
 * Cart Merge API Route - Merge guest cart with user cart on login
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface MergeRequest {
  guestSessionId: string;
  userId: string;
  strategy?: 'replace' | 'merge' | 'keep_existing';
}

/**
 * POST /api/cart/merge - Merge guest cart with user cart
 */
export async function POST(request: NextRequest) {
  try {
    const body: MergeRequest = await request.json();
    const { guestSessionId, userId, strategy = 'merge' } = body;

    if (!guestSessionId || !userId) {
      return NextResponse.json(
        { error: 'guestSessionId and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get guest cart items
    const { data: guestItems, error: guestError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_variant_id,
        quantity,
        created_at,
        product_variants(
          id,
          quantity as stock,
          products(id, name)
        )
      `)
      .eq('session_id', guestSessionId);

    if (guestError) {
      throw new Error(`Failed to fetch guest cart: ${guestError.message}`);
    }

    if (!guestItems || guestItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No guest cart items to merge',
        mergedItems: 0
      });
    }

    // Get existing user cart items
    const { data: userItems, error: userError } = await supabase
      .from('cart_items')
      .select('id, product_variant_id, quantity')
      .eq('user_id', userId);

    if (userError) {
      throw new Error(`Failed to fetch user cart: ${userError.message}`);
    }

    let mergedItems = 0;
    let conflictItems = 0;

    // Process each guest item
    for (const guestItem of guestItems) {
      const existingUserItem = userItems?.find(
        item => item.product_variant_id === guestItem.product_variant_id
      );

      if (existingUserItem) {
        // Handle merge conflict based on strategy
        let newQuantity: number;

        switch (strategy) {
          case 'replace':
            newQuantity = guestItem.quantity;
            break;
          case 'keep_existing':
            continue; // Skip this item
          case 'merge':
          default:
            newQuantity = existingUserItem.quantity + guestItem.quantity;
            break;
        }

        // Check stock availability
        const maxStock = guestItem.product_variants.stock;
        if (newQuantity > maxStock) {
          newQuantity = maxStock;
          conflictItems++;
        }

        // Update existing user cart item
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserItem.id);

        if (updateError) {

          continue;
        }

        mergedItems++;
      } else {
        // Add new item to user cart
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_variant_id: guestItem.product_variant_id,
            quantity: guestItem.quantity,
            created_at: guestItem.created_at,
            updated_at: new Date().toISOString()
          });

        if (insertError) {

          continue;
        }

        mergedItems++;
      }
    }

    // Clear guest cart after successful merge
    if (mergedItems > 0) {
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', guestSessionId);

      if (clearError) {

        // Don't fail the request, just log the error
      }
    }

    const response = {
      success: true,
      message: `Successfully merged ${mergedItems} items`,
      mergedItems,
      conflictItems,
      strategy,
      guestItemsCount: guestItems.length
    };

    return NextResponse.json(response);

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to merge carts' },
      { status: 500 }
    );
  }
}

