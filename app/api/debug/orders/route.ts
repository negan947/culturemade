import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Starting orders API call ===');
    
    // Test 1: Check if we can create supabase client
    console.log('=== DEBUG: Creating Supabase client ===');
    const supabase = await createServerClient();
    console.log('=== DEBUG: Supabase client created successfully ===');
    
    // Test 2: Check if we can query orders table directly
    console.log('=== DEBUG: Testing simple orders query ===');
    const { data: orders, error: ordersError, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(1);
    
    console.log('=== DEBUG: Orders query result ===', { orders, ordersError, count });
    
    if (ordersError) {
      console.error('=== DEBUG: Orders query failed ===', ordersError);
      return NextResponse.json({
        error: 'Orders query failed',
        details: ordersError.message,
        code: ordersError.code
      }, { status: 500 });
    }
    
    // Test 3: Try the problematic profiles join
    console.log('=== DEBUG: Testing profiles join query ===');
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
    
    console.log('=== DEBUG: Join query result ===', { joinResult, joinError });
    
    if (joinError) {
      console.error('=== DEBUG: Join query failed ===', joinError);
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
    
  } catch (error) {
    console.error('=== DEBUG: Caught exception ===', error);
    return NextResponse.json({
      error: 'Exception caught',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}