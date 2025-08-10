import { NextRequest, NextResponse } from 'next/server';

import { z } from '@/lib/validations';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  checkoutSessionId: z.string().uuid().optional(),
  // Guest cart session for loading cart when not authenticated
  sessionId: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { checkoutSessionId, sessionId } = parsed.data;

    const { user } = await getUser();
    const userId = user?.id ?? undefined;

    // Require some cart context
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either authenticated user or sessionId is required' },
        { status: 400 }
      );
    }

    // Load cart fresh for validation
    const params = new URLSearchParams(userId ? { userId } : { sessionId: sessionId as string });
    const cartRes = await fetch(`${request.nextUrl.origin}/api/cart?${params.toString()}`, { cache: 'no-store' });
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
          hasLowStockItems: boolean;
          hasOutOfStockItems: boolean;
        }
      | undefined;

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Re-validate against live inventory
    const supabase = await createClient();
    const variantIds = cart.items.map((i) => i.variant_id);
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, price, quantity')
      .in('id', variantIds);
    if (variantsError) {
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    const variantMap = new Map((variants || []).map((v: any) => [v.id, v]));
    const conflicts: Array<{ cart_item_id: string; product_name: string; requested: number; available: number }> = [];

    for (const item of cart.items) {
      const v = variantMap.get(item.variant_id);
      const available = typeof v?.quantity === 'number' ? v.quantity : 0;
      if (available <= 0) {
        conflicts.push({ cart_item_id: item.id, product_name: item.product_name, requested: item.quantity, available: 0 });
      } else if (item.quantity > available) {
        conflicts.push({ cart_item_id: item.id, product_name: item.product_name, requested: item.quantity, available });
      }
    }

    // Recalculate totals with current prices (prefer variant price; fallback to cart item price)
    const newSubtotal = cart.items.reduce((sum, item) => {
      const v = variantMap.get(item.variant_id);
      const price = typeof v?.price === 'number' ? v.price : item.price;
      return sum + price * item.quantity;
    }, 0);
    const tax = parseFloat((newSubtotal * 0.08).toFixed(2));
    const shipping = newSubtotal > 75 ? 0 : 10; // same heuristic as cart for now
    const discount = 0;
    const newTotal = parseFloat((newSubtotal + tax + shipping - discount).toFixed(2));

    // Attempt to read session amounts for authenticated users (RLS allows SELECT for own rows)
    let sessionAmounts: { subtotal: number; tax_amount: number; shipping_amount: number; discount_amount: number; total_amount: number } | null = null;
    if (userId && checkoutSessionId) {
      const { data: sessionRow } = await supabase
        .from('checkout_sessions')
        .select('subtotal, tax_amount, shipping_amount, discount_amount, total_amount')
        .eq('id', checkoutSessionId)
        .eq('user_id', userId)
        .single();
      if (sessionRow) {
        sessionAmounts = sessionRow as any;
      }
    }

    const totalsChanged = !!sessionAmounts && (
      parseFloat(sessionAmounts.subtotal as any) !== parseFloat(newSubtotal.toFixed(2)) ||
      parseFloat(sessionAmounts.tax_amount as any) !== tax ||
      parseFloat(sessionAmounts.shipping_amount as any) !== shipping ||
      parseFloat(sessionAmounts.total_amount as any) !== newTotal
    );

    const canProceed = conflicts.length === 0;

    return NextResponse.json({
      success: true,
      canProceed,
      conflicts,
      totals: {
        subtotal: parseFloat(newSubtotal.toFixed(2)),
        tax,
        shipping,
        discount,
        total: newTotal,
      },
      sessionTotals: sessionAmounts,
      totalsChanged,
      reservation: {
        supported: false,
        note: 'Soft reservations not implemented yet. Recommend adding a reservations table for robust locking.',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to validate checkout' }, { status: 500 });
  }
}


