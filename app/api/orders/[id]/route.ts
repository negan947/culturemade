import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Verify order belongs to user via RLS and filter
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `id, order_number, user_id, email, phone, status, payment_status, fulfillment_status,
         subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency,
         billing_address_id, shipping_address_id, notes, metadata, created_at, updated_at,
         shipments:shipments(
           id, tracking_number, carrier, status, shipped_at, delivered_at
         )`
      )
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select(
        `id, product_id, variant_id, product_name, variant_name, price, quantity, subtotal`
      )
      .eq('order_id', params.id);

    if (itemsErr) {
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: { ...order, items: items || [] } });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}


