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
      console.error('Error fetching order:', error);
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
      console.error('Error fetching order items:', itemsError);
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

  } catch (error) {
    console.error('Admin order detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
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
    const updateData: OrderUpdateData = await request.json();

    // Validate status values
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validFulfillmentStatuses = ['unfulfilled', 'partial', 'fulfilled'];

    if (updateData.status && !validStatuses.includes(updateData.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (updateData.fulfillment_status && !validFulfillmentStatuses.includes(updateData.fulfillment_status)) {
      return NextResponse.json(
        { error: 'Invalid fulfillment status value' },
        { status: 400 }
      );
    }

    // Update order
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert({
        action: 'order_updated',
        resource_type: 'order',
        resource_id: params.id,
        metadata: {
          changes: updateData,
          order_number: order.order_number
        }
      });

    if (logError) {
      console.error('Error logging admin action:', logError);
    }

    return NextResponse.json({
      order,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Admin order update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}