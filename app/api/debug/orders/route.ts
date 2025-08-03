import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {

    
    // Test 1: Check if we can create supabase client

    const supabase = await createServerClient();

    
    // Test 2: Check if we can query orders table directly

    const { data: orders, error: ordersError, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(1);
    

    
    if (ordersError) {

      return NextResponse.json({
        error: 'Orders query failed',
        details: ordersError.message,
        code: ordersError.code
      }, { status: 500 });
    }
    
    // Test 3: Try the problematic profiles join

    const { data: joinResult, error: joinError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        status,
        total_amount,
        profiles(
          id,
          full_name
        )
      `)
      .limit(1);
    

    
    if (joinError) {

      return NextResponse.json({
        error: 'Join query failed',
        details: joinError.message,
        code: joinError.code
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        ordersCount: count,
        ordersData: orders,
        joinData: joinResult
      },
      message: 'All tests passed'
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to debug orders' },
      { status: 500 }
    );
  }
}
    
