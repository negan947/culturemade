import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from '@/lib/validations';

const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Country code must be ISO 3166-1 alpha-2');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format')
  .optional()
  .nullable();

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping', 'both']).default('both'),
  is_default: z.boolean().optional().default(false),
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

const postalCodeValidators: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  GB: /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[ABD-HJLNP-UW-Z]{2})$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
};

function normalizePostal(country: string, code: string): string {
  if (country === 'CA' || country === 'GB')
    return code.toUpperCase().replace(/\s+/g, '').replace(/(.{3})/, '$1 ').trim();
  return code;
}

function validatePostalByCountry(country: string, code: string): boolean {
  const re = postalCodeValidators[country];
  if (!re) return true; // Fallback: accept as free-form
  return re.test(code);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let query = supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (type === 'billing' || type === 'shipping' || type === 'both') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });

    return NextResponse.json({ addresses: data || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = await createClient();
    const payload = parsed.data;

    const normalizedPostal = normalizePostal(payload.country_code, payload.postal_code);
    if (!validatePostalByCountry(payload.country_code, normalizedPostal)) {
      return NextResponse.json(
        { error: 'Invalid postal/ZIP code for selected country' },
        { status: 400 }
      );
    }

    if (payload.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .in('type', [payload.type, 'both']);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        type: payload.type,
        is_default: payload.is_default || false,
        first_name: payload.first_name,
        last_name: payload.last_name,
        company: payload.company ?? null,
        address_line_1: payload.address_line_1,
        address_line_2: payload.address_line_2 ?? null,
        city: payload.city,
        state_province: payload.state_province,
        postal_code: normalizedPostal,
        country_code: payload.country_code,
        phone: payload.phone ?? null,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });

    return NextResponse.json({ address: data });
  } catch {
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}


