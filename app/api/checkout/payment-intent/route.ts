import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { getStripe, toStripeAmountCents } from '@/lib/stripe';
import { z } from '@/lib/validations';

// Input: either checkoutSessionId (preferred) or sessionId for guest carts
const requestSchema = z.object({
  checkoutSessionId: z.string().uuid().optional(),
  sessionId: z.string().trim().optional(),
  // Optional email/name for guests to create ephemeral Stripe customer context
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { checkoutSessionId, sessionId, email, name } = parsed.data;

    // Identify user context
    const { user } = await getUser();
    const userId = user?.id ?? null;

    // Load checkout session totals and items
    const supabase = await createClient();

    let sessionRow:
      | {
          id: string;
          user_id: string | null;
          guest_session_id: string | null;
          currency: string;
          subtotal: number;
          tax_amount: number;
          shipping_amount: number;
          discount_amount: number;
          total_amount: number;
          discount_code: string | null;
          status: string;
          items: Array<{
            cart_item_id: string;
            product_id: string;
            variant_id: string;
            product_name: string;
            variant_title: string | null;
            price: number;
            quantity: number;
            line_total: number;
          }>;
        }
      | null = null;

    if (checkoutSessionId && userId) {
      // Authenticated users can read their own checkout sessions (RLS should allow by user_id)
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select(
          'id,user_id,guest_session_id,currency,subtotal,tax_amount,shipping_amount,discount_amount,total_amount,discount_code,status,items'
        )
        .eq('id', checkoutSessionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        return NextResponse.json(
          { error: 'Failed to load checkout session' },
          { status: 500 }
        );
      }
      sessionRow = (data as any) ?? null;
    }

    // Fallback for guests or when session row isn't readable due to RLS: compute from cart
    if (!sessionRow) {
      if (!userId && !sessionId) {
        return NextResponse.json(
          { error: 'Missing sessionId for guest payment' },
          { status: 400 }
        );
      }
      const queryParams = new URLSearchParams(
        userId ? { userId } : { sessionId: sessionId as string }
      );
      const cartResponse = await fetch(
        `${request.nextUrl.origin}/api/cart?${queryParams.toString()}`,
        { cache: 'no-store' }
      );
      if (!cartResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to load cart for payment' },
          { status: 500 }
        );
      }
      const cartJson = await cartResponse.json();
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
      sessionRow = {
        id: 'ephemeral',
        user_id: userId,
        guest_session_id: userId ? null : (sessionId as string),
        currency: 'USD',
        subtotal: cart.subtotal,
        tax_amount: cart.tax,
        shipping_amount: cart.shipping,
        discount_amount: 0,
        total_amount: cart.total,
        discount_code: null,
        status: 'created',
        items: cart.items.map((i) => ({
          cart_item_id: i.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          product_name: i.product_name,
          variant_title: i.variant_title || null,
          price: i.price,
          quantity: i.quantity,
          line_total: i.total,
        })),
      };
    }

    // Optionally attach Stripe customer if available for authenticated user
    const stripe = getStripe();

    const amountCents = toStripeAmountCents(Number(sessionRow.total_amount));
    if (amountCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount for payment' },
        { status: 400 }
      );
    }

    // Build metadata from items (limited size by Stripe)
    const itemSummaries = sessionRow.items
      .slice(0, 10)
      .map(
        (i) => `${i.product_name}${i.variant_title ? ` (${i.variant_title})` : ''} x${i.quantity}`
      )
      .join('; ');

    const metadata: Record<string, string> = {
      checkout_session_id: sessionRow.id,
      discount_code: sessionRow.discount_code ?? '',
      item_count: String(sessionRow.items.length),
      items: itemSummaries,
    };

    let customerId: string | undefined = undefined;
    if (userId) {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle();
      if (profileRow?.stripe_customer_id) {
        customerId = profileRow.stripe_customer_id as string;
      }
    }

    // Optionally attach a customer if we have an authenticated user in the future
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (sessionRow.currency || 'USD').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
      ...(customerId ? { customer: customerId } : {}),
    });

    // Optionally persist a payments row for tracking (without order yet)
    const { error: paymentsError } = await supabase.from('payments').insert({
      order_id: null,
      stripe_payment_intent_id: paymentIntent.id,
      amount: sessionRow.total_amount,
      currency: sessionRow.currency || 'USD',
      status: 'pending',
      method: 'card',
      metadata,
    });
    if (paymentsError) {
      // Do not fail the endpoint; log-only behavior in production systems
      // Here we surface a soft warning
      console.warn('Failed to insert payments row:', paymentsError.message);
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}


