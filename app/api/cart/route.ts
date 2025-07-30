/**
 * Cart API Route - Handles cart operations with Supabase
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { CartItem, CartSummary } from '@/utils/cartUtils';

/**
 * GET /api/cart - Get user's cart
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }
    const supabase = await createClient();

    // Query cart items with product details
    let query = supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        variant_id,
        product_id
      `);
    
    // Apply user/session filter
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data: cartItems, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch cart: ${error.message}`);
    }

    // If no cart items, return empty cart
    if (!cartItems || cartItems.length === 0) {
      const emptyCart: CartSummary = {
        items: [],
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        hasLowStockItems: false,
        hasOutOfStockItems: false
      };
      return NextResponse.json(emptyCart);
    }

    // Get variant IDs to fetch details
    const variantIds = cartItems.map((item: any) => item.variant_id);
    
    // Fetch variant details separately  
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        price,
        quantity,
        product_id
      `)
      .in('id', variantIds);

    if (variantError) {
      throw new Error(`Failed to fetch variant details: ${variantError.message}`);
    }

    // Get unique product IDs
    const productIds = [...new Set((variants || []).map((v: any) => v.product_id))];
    
    // Fetch product details separately
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        product_images(url, alt_text, position)
      `)
      .in('id', productIds);

    if (productError) {
      throw new Error(`Failed to fetch product details: ${productError.message}`);
    }

    // Create lookup maps
    const variantMap: { [key: string]: any } = {};
    (variants || []).forEach((variant: any) => {
      variantMap[variant.id] = variant;
    });

    const productMap: { [key: string]: any } = {};
    (products || []).forEach((product: any) => {
      productMap[product.id] = product;
    });

    // Transform cart items
    const items: CartItem[] = cartItems.map((item: any) => {
      const variant = variantMap[item.variant_id];
      if (!variant) {
        throw new Error(`Variant not found for cart item: ${item.id}`);
      }
      
      const product = productMap[variant.product_id];
      if (!product) {
        throw new Error(`Product not found for variant: ${variant.id}`);
      }
      
      return {
        id: item.id,
        variant_id: item.variant_id,
        product_id: product.id,
        product_name: product.name,
        variant_title: variant.name || '',
        price: parseFloat(variant.price || product.price || '0'),
        quantity: item.quantity,
        image_url: product.product_images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url || null,
        image_alt: product.product_images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.alt_text || product.name,
        total: parseFloat((parseFloat(variant.price || product.price || '0') * item.quantity).toFixed(2)),
        created_at: item.created_at
      };
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 75 ? 0 : 10; // Free shipping over $75
    const total = subtotal + tax + shipping;

    // Check stock status for each item
    const hasOutOfStockItems = cartItems.some((cartItem: any) => {
      const variant = variantMap[cartItem.variant_id];
      return variant && cartItem.quantity > variant.quantity;
    });
    const hasLowStockItems = cartItems.some((cartItem: any) => {
      const variant = variantMap[cartItem.variant_id];
      return variant && variant.quantity <= 5 && variant.quantity > 0;
    });

    const cart: CartSummary = {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      hasLowStockItems,
      hasOutOfStockItems
    };

    return NextResponse.json(cart);

  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart - Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity, userId, sessionId } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'productId and quantity are required' },
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

    // If no variant ID provided, get the first available variant for this product
    let finalVariantId = variantId;
    if (!finalVariantId) {
      const { data: variants, error: variantError } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (variantError) {
        return NextResponse.json(
          { error: `Failed to find product variants: ${variantError.message}` },
          { status: 400 }
        );
      }

      if (!variants || variants.length === 0) {
        return NextResponse.json(
          { error: 'No variants found for this product' },
          { status: 400 }
        );
      }

      finalVariantId = variants[0].id;
    }

    // Add item to cart or update quantity if exists
    let checkQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('variant_id', finalVariantId);
    
    if (userId) {
      checkQuery = checkQuery.eq('user_id', userId);
    } else if (sessionId) {
      checkQuery = checkQuery.eq('session_id', sessionId);
    }
    
    const { data: existingItem, error: checkError } = await checkQuery.single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check existing cart item: ${checkError.message}`);
    }

    let result;
    if (existingItem) {
      // Update existing item quantity
      const { data, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
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
          variant_id: finalVariantId,
          product_id: productId,
          quantity,
          user_id: userId || null,
          session_id: sessionId || null
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
      message: 'Item added to cart',
      cartItem: result
    });

  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cart - Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, quantity, userId, sessionId } = body;

    if (!cartItemId || !quantity) {
      return NextResponse.json(
        { error: 'cartItemId and quantity are required' },
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

    // Update cart item quantity
    let updateQuery = supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);
    
    if (userId) {
      updateQuery = updateQuery.eq('user_id', userId);
    } else if (sessionId) {
      updateQuery = updateQuery.eq('session_id', sessionId);
    }
    
    const { data, error } = await updateQuery.select().single();

    if (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item quantity updated',
      cartItem: data
    });

  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart - Remove cart item
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

    // Remove cart item
    let deleteQuery = supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
    
    if (userId) {
      deleteQuery = deleteQuery.eq('user_id', userId);
    } else if (sessionId) {
      deleteQuery = deleteQuery.eq('session_id', sessionId);
    }
    
    const { error } = await deleteQuery;

    if (error) {
      throw new Error(`Failed to remove cart item: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item removed'
    });

  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}