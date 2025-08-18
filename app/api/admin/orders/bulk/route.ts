import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const BulkActionSchema = z.object({
  action: z.enum(['update_status', 'export', 'delete']),
  orderIds: z.array(z.string().uuid()),
  data: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    
    // Validate request body
    const { action, orderIds, data } = BulkActionSchema.parse(body);
    
    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders selected' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_status': {
        if (!data?.['status']) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }

        // Update order statuses
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: data['status'],
            updated_at: new Date().toISOString()
          })
          .in('id', orderIds);

        if (error) {
          console.error('Error updating order statuses:', error);
          return NextResponse.json(
            { error: 'Failed to update order statuses' },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: `Updated ${orderIds.length} orders to ${data['status']}` 
        });
      }

      case 'export': {
        // Get orders with details for export
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!left (full_name, email),
            order_items (
              id,
              quantity,
              unit_price,
              total_price,
              product_variants (
                sku,
                products (name)
              )
            )
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders for export:', error);
          return NextResponse.json(
            { error: 'Failed to fetch orders for export' },
            { status: 500 }
          );
        }

        // Format data for CSV export
        const csvData = orders?.map(order => ({
          order_number: order.order_number,
          customer_name: order.profiles?.full_name || 'Guest',
          customer_email: order.email,
          status: order.status,
          payment_status: order.payment_status,
          fulfillment_status: order.fulfillment_status,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount || 0,
          shipping_amount: order.shipping_amount || 0,
          discount_amount: order.discount_amount || 0,
          total_amount: order.total_amount,
          currency: order.currency,
          item_count: order.order_items?.length || 0,
          created_at: order.created_at,
          updated_at: order.updated_at,
          notes: order.notes
        })) || [];

        return NextResponse.json({ 
          success: true, 
          data: csvData,
          filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`
        });
      }

      case 'delete': {
        // Note: In production, you might want to soft-delete or have additional checks
        const { error } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);

        if (error) {
          console.error('Error deleting orders:', error);
          return NextResponse.json(
            { error: 'Failed to delete orders' },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: `Deleted ${orderIds.length} orders` 
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in bulk orders operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}