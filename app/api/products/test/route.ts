import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// Simple test endpoint to debug the products API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Test basic product query
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        status,
        created_at
      `)
      .eq('status', 'active')
      .limit(2);

    if (error) {

      return NextResponse.json(
        { 
          success: false,
          error: 'Database error',
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products?.length || 0
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to test products connection' },
      { status: 500 }
    );
  }
}

