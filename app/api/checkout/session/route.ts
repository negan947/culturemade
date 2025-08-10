import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

// Local helpers to avoid coupling to client-only utils
function calculateTax(subtotal: number, taxRate: number = 0.08): number {
  return parseFloat((subtotal * taxRate).toFixed(2));
}

function calculateShipping(subtotal: number): number {
  if (subtotal >= 75) return 0; // Free shipping over $75
  if (subtotal >= 25) return 5; // Reduced shipping over $25
  return 10; // Standard shipping
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedSessionId: string | undefined = body?.sessionId;
    const currency: string = body?.currency || 'USD';
    const discountCode: string | undefined = body?.discountCode;

    // Determine user or guest session context
    const { user } = await getUser();
    const userId = user?.id ?? undefined;

    // Require a sessionId for guests
    if (!userId && !providedSessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId for guest checkout' },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams(
      userId ? { userId } : { sessionId: providedSessionId as string }
    );

    // Load current cart summary from our existing cart endpoint for consistency
    const cartResponse = await fetch(
      `${request.nextUrl.origin}/api/cart?${queryParams.toString()}`,
      { cache: 'no-store' }
    );

    if (!cartResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to load cart for checkout' },
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
          itemCount: number;
          subtotal: number;
          tax: number;
          shipping: number;
          total: number;
          hasLowStockItems: boolean;
          hasOutOfStockItems: boolean;
        }
      | undefined;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Inventory validation: do not proceed if any out-of-stock items are present
    if (cart.hasOutOfStockItems) {
      return NextResponse.json(
        { error: 'One or more items are out of stock. Please review your cart.' },
        { status: 409 }
      );
    }

    // Recalculate totals on server to guard against stale values
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = calculateTax(subtotal);
    const shipping = calculateShipping(subtotal);
    const discount = 0; // Placeholder: discount application handled in later steps
    const total = parseFloat((subtotal + tax + shipping - discount).toFixed(2));

    // Generate a secure session id
    const sessionId = crypto.randomUUID();

    // Build checkout session payload (will persist below)
    const now = Date.now();
    const expiresAt = new Date(now + 30 * 60 * 1000).toISOString(); // 30 minutes

    const checkoutSession = {
      id: sessionId,
      userId: userId ?? null,
      guestSessionId: userId ? null : (providedSessionId as string),
      currency,
      amounts: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        shipping,
        discount,
        total,
      },
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
      discountCode: discountCode || null,
      status: 'created' as const,
      createdAt: new Date(now).toISOString(),
      expiresAt,
      persisted: false, // Flip to true once DB table is added and insert succeeds
    };

    // Persist checkout session respecting RLS
    const supabase = await createClient();

    const insertPayload = {
      id: sessionId,
      user_id: userId ?? null,
      guest_session_id: userId ? null : (providedSessionId as string),
      currency,
      subtotal: checkoutSession.amounts.subtotal,
      tax_amount: tax,
      shipping_amount: shipping,
      discount_amount: discount,
      total_amount: total,
      discount_code: discountCode ?? null,
      status: 'created',
      items: checkoutSession.items,
      expires_at: expiresAt,
    } as const;

    // Important: do NOT call .select() for anon (no SELECT policy). We rely on error signal only.
    const { error: insertError } = await supabase
      .from('checkout_sessions')
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to persist checkout session', details: insertError.message },
        { status: 500 }
      );
    }

    checkoutSession.persisted = true;

    return NextResponse.json({
      success: true,
      session: checkoutSession,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}


