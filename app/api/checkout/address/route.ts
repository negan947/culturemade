import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from '@/lib/validations';

/**
 * Address validation schemas (Zod)
 * - Matches DB fields in `public.addresses` (see types/database.ts)
 */
const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Country code must be ISO 3166-1 alpha-2');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/,
    'Please enter a valid phone number in E.164 format (e.g. +15551234567)'
  )
  .optional()
  .nullable();

const postalCodeValidators: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  GB: /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[ABD-HJLNP-UW-Z]{2})$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
};

const addressSchema = z.object({
  first_name: z.string().trim().min(1).max(50),
  last_name: z.string().trim().min(1).max(50),
  company: z.string().trim().max(100).optional().nullable(),
  address_line_1: z.string().trim().min(3).max(120),
  address_line_2: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().min(1).max(80),
  state_province: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().min(3).max(20),
  country_code: countryCodeSchema,
  phone: phoneSchema,
});

const payloadSchema = z.object({
  addressType: z.enum(['billing', 'shipping']),
  address: addressSchema,
  // Use cart context for shipping quote
  sessionId: z.string().trim().optional(),
  // Whether to save address for authenticated users
  save: z.boolean().optional().default(true),
  setDefault: z.boolean().optional().default(false),
});

function normalizePostal(country: string, code: string): string {
  if (country === 'CA' || country === 'GB') return code.toUpperCase().replace(/\s+/g, '').replace(/(.{3})/, '$1 ').trim();
  return code;
}

function validatePostalByCountry(country: string, code: string): boolean {
  const re = postalCodeValidators[country];
  if (!re) return true; // Fallback: accept as free-form
  return re.test(code);
}

// Simple shipping quote logic by country and subtotal
function calculateShippingQuote(country: string, subtotal: number): number {
  const isDomestic = country === 'US';
  if (isDomestic) {
    if (subtotal >= 75) return 0;
    if (subtotal >= 25) return 5;
    return 10;
  }
  if (country === 'CA') {
    if (subtotal >= 100) return 0;
    if (subtotal >= 50) return 12;
    return 15;
  }
  // International default
  if (subtotal >= 200) return 0;
  if (subtotal >= 100) return 20;
  return 25;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { addressType, address, sessionId, save, setDefault } = parsed.data;

    // Country-specific postal normalization and validation
    const normalizedPostal = normalizePostal(address.country_code, address.postal_code);
    if (!validatePostalByCountry(address.country_code, normalizedPostal)) {
      return NextResponse.json(
        { error: 'Invalid postal/ZIP code for selected country' },
        { status: 400 }
      );
    }

    // Determine user context
    const { user } = await getUser();
    const userId = user?.id ?? undefined;

    // Pull current subtotal from cart to compute a shipping quote consistently
    let subtotal = 0;
    try {
      const params = new URLSearchParams(
        userId ? { userId } : sessionId ? { sessionId } : {}
      );
      if (params.toString()) {
        const cartRes = await fetch(
          `${request.nextUrl.origin}/api/cart?${params.toString()}`,
          { cache: 'no-store' }
        );
        if (cartRes.ok) {
          const cartJson = await cartRes.json();
          const items: Array<{ price: number; quantity: number }> = cartJson?.cart?.items || [];
          subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
        }
      }
    } catch {
      // If cart fetch fails, fallback to 0 subtotal (conservative higher shipping)
      subtotal = 0;
    }

    const shipping_quote = calculateShippingQuote(address.country_code, subtotal);

    // Persist for authenticated users only, aligned with RLS policies on public.addresses
    let saved = false;
    let address_id: string | undefined;
    if (userId && save) {
      const supabase = await createClient();

      if (setDefault) {
        // Clear existing defaults for this type
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .in('type', [addressType, 'both']);
      }

      const insertPayload = {
        user_id: userId,
        type: addressType,
        is_default: setDefault || false,
        first_name: address.first_name,
        last_name: address.last_name,
        company: address.company ?? null,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 ?? null,
        city: address.city,
        state_province: address.state_province,
        postal_code: normalizedPostal,
        country_code: address.country_code,
        phone: address.phone ?? null,
      } as const;

      const { data, error } = await supabase
        .from('addresses')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to save address', details: error.message },
          { status: 500 }
        );
      }
      saved = true;
      address_id = data?.id as string | undefined;
    }

    return NextResponse.json({
      success: true,
      address: {
        ...address,
        postal_code: normalizedPostal,
      },
      addressType,
      shipping_quote,
      persisted: { saved, address_id },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process address' },
      { status: 500 }
    );
  }
}



