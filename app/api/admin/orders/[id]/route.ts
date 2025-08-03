import { NextRequest, NextResponse } from 'next/server';

import { getUserContext } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

interface OrderUpdateData {
  status?: string;
  fulfillment_status?: string;
  notes?: string;
  metadata?: any;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check user authentication and admin status
    const userContext = await getUserContext();
    
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch order with related data
    const { data: order, error } = await supabase
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
        billing_address_id,
        shipping_address_id,
        notes,
        metadata,
        created_at,
        updated_at,
        profiles(
          id,
          full_name,
          avatar_url
        ),
        addresses!billing_address_id(
          id,
          type,
          first_name,
          last_name,
          company,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country
        ),
        shipping_address:addresses!shipping_address_id(
          id,
          type,
          first_name,
          last_name,
          company,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        price,
        quantity,
        subtotal,
        products(
          id,
          name,
          slug
        ),
        product_variants(
          id,
          size,
          color,
          sku
        )
      `)
      .eq('order_id', params.id);

    if (itemsError) {

      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order: {
        ...order,
        items: orderItems || []
      }
    });

  } catch (error: any) {
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden - Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

