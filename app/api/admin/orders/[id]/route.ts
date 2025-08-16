import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserContext } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';


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
        addresses:addresses!billing_address_id(
          id,
          type,
          first_name,
          last_name,
          company,
          address_line_1,
          address_line_2,
          city,
          state:state_province,
          postal_code,
          country:country_code
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
          state:state_province,
          postal_code,
          country:country_code
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
          size:option1,
          color:option2,
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

const UpdateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  fulfillment_status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  tracking_number: z.string().max(100).optional(),
  carrier: z.string().max(50).optional()
});

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
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateOrderSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Check if order exists first
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, fulfillment_status')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
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

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // If tracking number was provided, create/update shipment record
    if (validatedData.tracking_number || validatedData.carrier) {
      const shipmentData = {
        order_id: params.id,
        tracking_number: validatedData.tracking_number,
        carrier: validatedData.carrier,
        status: validatedData.fulfillment_status === 'shipped' ? 'in_transit' : 'pending',
        shipped_at: validatedData.fulfillment_status === 'shipped' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      // Try to update existing shipment first
      const { error: shipmentUpdateError } = await supabase
        .from('shipments')
        .upsert(shipmentData, { 
          onConflict: 'order_id',
          ignoreDuplicates: false 
        });

      if (shipmentUpdateError) {
        console.error('Error updating shipment:', shipmentUpdateError);
        // Don't fail the entire request if shipment update fails
      }
    }

    // Log admin action for audit trail
    try {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: userContext.user.id,
          action: 'update_order',
          resource_type: 'order',
          resource_id: params.id,
          details: {
            previous_values: existingOrder,
            updated_values: validatedData,
            updated_fields: Object.keys(validatedData)
          },
          metadata: {
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error in PUT /api/admin/orders/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
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

