/**
 * Cart Count API Route - Get cart item count
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cart/count - Get cart item count
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

    // Get total quantity of items in cart
    let query = supabase
      .from('cart_items')
      .select('quantity');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }
    
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get cart count: ${error.message}`);
    }

    const count = (data || []).reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json({ count });

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to get cart count' },
      { status: 500 }
    );
  }
}

