import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/auth';

const ShippingLabelSchema = z.object({
  orderIds: z.array(z.string().uuid()),
  carrier: z.enum(['UPS', 'FedEx', 'USPS', 'DHL']),
  service: z.string(),
  insurance: z.boolean().optional(),
  signature: z.boolean().optional()
});

const BatchShippingSchema = z.object({
  orderIds: z.array(z.string().uuid()),
  carrier: z.enum(['UPS', 'FedEx', 'USPS', 'DHL']),
  service: z.string()
});

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate_label': {
        const { orderIds, carrier, service, insurance = false, signature = false } = ShippingLabelSchema.parse(body);
        
        // Get orders with shipping addresses
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            addresses!shipping_address_id (
              first_name,
              last_name,
              company,
              address_line_1,
              address_line_2,
              city,
              state_province,
              postal_code,
              country_code
            ),
            order_items (
              quantity,
              product_variants (
                weight
              )
            )
          `)
          .in('id', orderIds);

        if (ordersError) {
          return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
          );
        }

        // Generate shipping labels (mock implementation)
        const labels = [];
        
        for (const order of orders || []) {
          // Calculate total weight
          const totalWeight = order.order_items?.reduce((sum: number, item: any) => {
            const weight = item.product_variants?.weight || 1; // Default 1 lb if no weight
            return sum + (weight * item.quantity);
          }, 0) || 1;

          // Generate mock tracking number
          const trackingNumber = `${carrier}${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

          const label = {
            orderId: order.id,
            orderNumber: order.order_number,
            trackingNumber,
            carrier,
            service,
            weight: totalWeight,
            insurance,
            signature,
            cost: calculateShippingCost(totalWeight, carrier, service),
            labelUrl: `https://api.shipping.example.com/labels/${trackingNumber}.pdf`, // Mock URL
            address: order.addresses
          };

          labels.push(label);

          // Update order with tracking information
          await supabase
            .from('orders')
            .update({
              fulfillment_status: 'shipped',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          // Create/update shipment record
          await supabase
            .from('shipments')
            .upsert({
              order_id: order.id,
              tracking_number: trackingNumber,
              carrier,
              service,
              status: 'in_transit',
              shipped_at: new Date().toISOString(),
              weight: totalWeight,
              cost: label.cost,
              label_url: label.labelUrl,
              insurance,
              signature_required: signature,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'order_id' });
        }

        return NextResponse.json({ 
          success: true, 
          labels,
          message: `Generated ${labels.length} shipping labels`
        });
      }

      case 'batch_process': {
        const { orderIds, carrier, service } = BatchShippingSchema.parse(body);
        
        // Batch process multiple orders
        const processed = [];
        
        for (const orderId of orderIds) {
          try {
            // Generate tracking number
            const trackingNumber = `${carrier}${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            
            // Update order status
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                fulfillment_status: 'processing',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);

            if (updateError) {
              console.error(`Failed to update order ${orderId}:`, updateError);
              continue;
            }

            // Create shipment record
            await supabase
              .from('shipments')
              .upsert({
                order_id: orderId,
                tracking_number: trackingNumber,
                carrier,
                service,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'order_id' });

            processed.push({
              orderId,
              trackingNumber,
              status: 'processed'
            });

          } catch (error) {
            console.error(`Error processing order ${orderId}:`, error);
            processed.push({
              orderId,
              status: 'failed',
              error: 'Processing failed'
            });
          }
        }

        return NextResponse.json({ 
          success: true, 
          processed,
          message: `Processed ${processed.filter(p => p.status === 'processed').length} of ${orderIds.length} orders`
        });
      }

      case 'get_rates': {
        const { destination, weight = 1, carrier } = body;
        
        // Mock shipping rate calculation
        const rates = getShippingRates(destination, weight, carrier);
        
        return NextResponse.json({ 
          success: true, 
          rates
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in shipping API:', error);
    
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

// Helper functions
function calculateShippingCost(weight: number, carrier: string, service: string): number {
  // Mock shipping cost calculation
  const baseCost = {
    'UPS': 8.50,
    'FedEx': 9.25,
    'USPS': 6.75,
    'DHL': 12.00
  }[carrier] || 8.00;

  const serviceMultiplier = service.includes('Express') || service.includes('Overnight') ? 2.5 : 
                           service.includes('Priority') ? 1.5 : 1.0;

  return Math.round((baseCost + (weight * 0.75)) * serviceMultiplier * 100) / 100;
}

function getShippingRates(destination: any, weight: number, carrier?: string) {
  // Mock shipping rates
  const carriers = carrier ? [carrier] : ['UPS', 'FedEx', 'USPS', 'DHL'];
  
  return carriers.map(c => ({
    carrier: c,
    services: [
      {
        name: 'Ground',
        cost: calculateShippingCost(weight, c, 'Ground'),
        delivery_days: '3-5 business days'
      },
      {
        name: 'Priority',
        cost: calculateShippingCost(weight, c, 'Priority'),
        delivery_days: '1-3 business days'
      },
      {
        name: 'Express',
        cost: calculateShippingCost(weight, c, 'Express'),
        delivery_days: 'Next business day'
      }
    ]
  }));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'shipments': {
        // Get all shipments with order info
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            *,
            orders (
              order_number,
              email,
              total_amount,
              currency
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch shipments' },
            { status: 500 }
          );
        }

        return NextResponse.json({ shipments });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in shipping GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}