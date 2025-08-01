/**
 * Cart Clear API Route - Clear all cart items
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cart/clear - Clear all cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    console.log('Clear cart request:', { userId, sessionId });

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build the filter condition properly
    let query = supabase.from('cart_items').delete();
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { error, data } = await query;

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
    
    console.log('Clear cart success:', data);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cart clear API error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}