import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateServerEnv } from '@/lib/validations/env';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const env = validateServerEnv();
  const stripe = getStripe();

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const payload = await request.text();

  let event: import('stripe').Stripe.Event;
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Idempotency: store and short-circuit if event was already processed
    const { error: idempotencyError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        payload: event as unknown as Record<string, unknown>,
      });

    if (idempotencyError) {
      // If unique violation on event_id, we've already processed this event
      if (idempotencyError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      // For other errors, continue but log internally
      console.warn('webhook idempotency insert error:', idempotencyError.message);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as {
          id: string;
          amount: number;
          currency: string;
          metadata?: Record<string, string>;
        };

        const checkoutSessionId = pi.metadata?.['checkout_session_id'] || null;

        // Update payments table
        await supabaseAdmin
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', pi.id);

        // Optionally update checkout session status to validated/paid
        if (checkoutSessionId) {
          await supabaseAdmin
            .from('checkout_sessions')
            .update({ status: 'paid' })
            .eq('id', checkoutSessionId);
        }

        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string };
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }
      case 'charge.refunded': {
        const ch = event.data.object as { id: string; payment_intent?: string | null };
        if (ch.payment_intent) {
          await supabaseAdmin
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', ch.payment_intent);
        }
        break;
      }
      default: {
        // No-op for unhandled events
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Webhook handling error' }, { status: 500 });
  }
}


