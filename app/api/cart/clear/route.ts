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

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Clear all cart items for the user/session
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`);

    if (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cart clear API error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}