import { NextRequest, NextResponse } from 'next/server';

import { getUserContext } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin Orders API - Starting request');
    
    // Check user authentication and admin status
    let userContext;
    try {
      userContext = await getUserContext();
    } catch (authError) {
      console.error('Admin Orders API - Error getting user context:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 500 }
      );
    }
    
    console.log('Admin Orders API - User Context:', {
      hasUserContext: !!userContext,
      isAdmin: userContext?.isAdmin,
      role: userContext?.role,
      userId: userContext?.user?.id
    });
    
    if (!userContext || !userContext.isAdmin) {
      console.log('Admin Orders API - Access denied:', {
        reason: !userContext ? 'No user context' : 'Not admin',
        userContext: userContext ? { role: userContext.role, isAdmin: userContext.isAdmin } : null
      });
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = await createClient();

    // First check if orders table has any data
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // If no orders exist, return empty result immediately
    if (!totalOrders || totalOrders === 0) {
      return NextResponse.json({
        orders: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Build query with proper error handling for empty table
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        email,
        phone,
        status,
        payment_status,
        fulfillment_status,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        currency,
        notes,
        created_at,
        updated_at,
        profiles(
          id,
          full_name
        )
      `)
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    // Handle case where orders is null (empty table)
    const ordersList = orders || [];

    // Build count query with same filters
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Apply same filters for count
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (search) {
      countQuery = countQuery.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting order count:', countError);
      return NextResponse.json(
        { error: 'Failed to get order count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orders: ordersList,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}