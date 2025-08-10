import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/services/email';
import { z } from '@/lib/validations';

type CheckoutSessionItem = {
  cart_item_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_title: string | null;
  price: number;
  quantity: number;
  line_total: number;
};

// Request validation
const addressSchema = z
  .object({
    first_name: z.string().trim().min(1).max(50),
    last_name: z.string().trim().min(1).max(50),
    company: z.string().trim().max(100).optional().nullable(),
    address_line_1: z.string().trim().min(3).max(120),
    address_line_2: z.string().trim().max(120).optional().nullable(),
    city: z.string().trim().min(1).max(80),
    state_province: z.string().trim().min(2).max(80),
    postal_code: z.string().trim().min(3).max(20),
    country_code: z.string().trim().toUpperCase().length(2),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?\d[\d\s-]{6,}$/)
      .optional()
      .nullable(),
  })
  .strict();

const createOrderSchema = z
  .object({
    paymentIntentId: z.string().min(5),
    checkoutSessionId: z.string().uuid().optional(),
    sessionId: z.string().trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().optional(),
    billing_address: addressSchema.optional(),
    shipping_address: addressSchema.optional(),
  })
  .strict();

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000) + 10000; // 5 digits
  return `CM-${yy}${mm}${dd}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const {
      paymentIntentId,
      checkoutSessionId,
      sessionId,
      email: providedEmail,
      phone,
      billing_address,
      shipping_address,
    } = parsed.data;

    const { user } = await getUser();
    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;

    // Verify payment status with Stripe
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed. Please complete payment first.' },
        { status: 409 }
      );
    }

    // Determine customer email (required)
    const customerEmail = userEmail || providedEmail || (paymentIntent.receipt_email as string | null) || null;
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required to create an order.' },
        { status: 400 }
      );
    }

    // Idempotency: if an order already exists for this payment intent, return it
    const supabaseAdmin = createAdminClient();
    {
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();
      if (existingPayment?.order_id) {
        return NextResponse.json({ success: true, orderId: existingPayment.order_id });
      }
    }

    // Load checkout session items/totals or fallback to cart computation
    let currency = 'USD';
    let subtotal = 0;
    let tax_amount = 0;
    let shipping_amount = 0;
    let discount_amount = 0;
    let total_amount = 0;
    let items: CheckoutSessionItem[] = [];

    // Prefer checkout session if provided
    if (checkoutSessionId) {
      const { data: sessionRow, error: sessionErr } = await supabaseAdmin
        .from('checkout_sessions')
        .select('id,currency,subtotal,tax_amount,shipping_amount,discount_amount,total_amount,items')
        .eq('id', checkoutSessionId)
        .maybeSingle();
      if (sessionErr) {
        return NextResponse.json({ error: 'Failed to load checkout session' }, { status: 500 });
      }
      if (sessionRow) {
        currency = sessionRow.currency || 'USD';
        subtotal = Number(sessionRow.subtotal || 0);
        tax_amount = Number(sessionRow.tax_amount || 0);
        shipping_amount = Number(sessionRow.shipping_amount || 0);
        discount_amount = Number(sessionRow.discount_amount || 0);
        total_amount = Number(sessionRow.total_amount || 0);
        items = (sessionRow.items as unknown as CheckoutSessionItem[]) || [];
      }
    }

    // Fallback to cart if needed
    if (items.length === 0 || total_amount <= 0) {
      const params = new URLSearchParams(
        userId ? { userId } : sessionId ? { sessionId } : {}
      );
      if (!params.toString()) {
        return NextResponse.json(
          { error: 'Missing cart or checkout session context to build order' },
          { status: 400 }
        );
      }
      const cartRes = await fetch(
        `${request.nextUrl.origin}/api/cart?${params.toString()}`,
        { cache: 'no-store' }
      );
      if (!cartRes.ok) {
        return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
      }
      const cartJson = await cartRes.json();
      const cart = cartJson?.cart as
        | {
            items: Array<{
              id: string;
              variant_id: string;
              product_id: string;
              product_name: string;
              variant_title?: string;
              price: number;
              quantity: number;
              total: number;
            }>;
            subtotal: number;
            tax: number;
            shipping: number;
            total: number;
          }
        | undefined;
      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
      }
      currency = 'USD';
      subtotal = Number(cart.subtotal);
      tax_amount = Number(cart.tax);
      shipping_amount = Number(cart.shipping);
      discount_amount = 0;
      total_amount = Number(cart.total);
      items = cart.items.map((i) => ({
        cart_item_id: i.id,
        product_id: i.product_id,
        variant_id: i.variant_id,
        product_name: i.product_name,
        variant_title: i.variant_title || null,
        price: Number(i.price),
        quantity: Number(i.quantity),
        line_total: Number(i.total),
      }));
    }

    if (items.length === 0 || total_amount <= 0) {
      return NextResponse.json({ error: 'Invalid order contents' }, { status: 400 });
    }

    // Build order insert payload
    const orderMetadata: Record<string, unknown> = {
      payment_intent_id: paymentIntentId,
      checkout_session_id: checkoutSessionId || null,
      guest_session_id: userId ? null : sessionId || null,
      billing_address,
      shipping_address,
    };

    const orderInsert = {
      order_number: generateOrderNumber(),
      user_id: userId,
      email: customerEmail,
      phone: phone || null,
      status: 'processing',
      payment_status: 'paid',
      fulfillment_status: 'unfulfilled',
      subtotal,
      tax_amount,
      shipping_amount,
      discount_amount,
      total_amount,
      currency,
      billing_address_id: null,
      shipping_address_id: null,
      notes: null,
      metadata: orderMetadata,
    } as const;

    // Insert order with retry on order_number collision
    let orderId: string | null = null;
    let orderNumber: string | null = (orderInsert as any).order_number as string;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('orders')
        .insert(orderInsert)
        .select('id, order_number')
        .single();
      if (!insertErr && inserted?.id) {
        orderId = inserted.id as string;
        orderNumber = inserted.order_number as string;
        break;
      }
      if (insertErr && insertErr.code === '23505') {
        // Unique violation on order_number; regenerate and retry
        (orderInsert as any).order_number = generateOrderNumber();
        continue;
      }
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items
    const orderItemsPayload = items.map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      variant_id: i.variant_id,
      product_name: i.product_name,
      variant_name: i.variant_title,
      price: Number(i.price),
      quantity: Number(i.quantity),
      subtotal: Number(i.line_total),
    }));
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItemsPayload);
    if (itemsErr) {
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Link payment to order
    await supabaseAdmin
      .from('payments')
      .update({ order_id: orderId, status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntentId);

    // Decrement quantities safely
    // Note: Even if some variants are null, updates will simply not match
    await Promise.all(
      items
        .filter((i) => !!i.variant_id)
        .map(async (i) => {
          // Decrement with a raw update via PostgREST using expression
          // We cannot express arithmetic update directly via supabase-js update payload
          // So we fetch current qty then set new value
          const { data: variantRow } = await supabaseAdmin
            .from('product_variants')
            .select('quantity')
            .eq('id', i.variant_id)
            .maybeSingle();
          const currentQty = Number(variantRow?.quantity ?? 0);
          const newQty = Math.max(currentQty - Number(i.quantity), 0);
          await supabaseAdmin
            .from('product_variants')
            .update({ quantity: newQty })
            .eq('id', i.variant_id);

          // Insert movement record
          await supabaseAdmin.from('inventory_movements').insert({
            variant_id: i.variant_id,
            type: 'sale',
            quantity: Number(i.quantity) * -1,
            reference_type: 'order',
            reference_id: orderId,
            notes: `Order ${orderInsert.order_number}`,
          });
        })
    );

    // Clear cart
    try {
      const supabase = await createClient();
      if (userId) {
        await supabase.from('cart_items').delete().eq('user_id', userId);
      } else if (sessionId) {
        await supabase.from('cart_items').delete().eq('session_id', sessionId);
      }
    } catch {}

    // Send confirmation email (non-blocking)
    try {
      await sendOrderConfirmationEmail({
        to: customerEmail,
        order: {
          id: orderId,
          order_number: (orderInsert as any).order_number as string,
          total_amount,
          currency,
          items: orderItemsPayload.map((oi) => ({
            product_name: oi.product_name,
            variant_name: oi.variant_name,
            quantity: oi.quantity,
            price: oi.price,
            subtotal: oi.subtotal,
          })),
        },
      });
    } catch {
      // Do not fail order creation if email fails
    }

    return NextResponse.json({ success: true, orderId, orderNumber, total: total_amount, currency });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create order', details: error?.message },
      { status: 500 }
    );
  }
}

// GET /api/orders - Return authenticated user's order history
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);

    const supabase = await createClient();
    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        `id, order_number, status, payment_status, fulfillment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency, created_at`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}


