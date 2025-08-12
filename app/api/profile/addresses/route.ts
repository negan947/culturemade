import { NextRequest, NextResponse } from 'next/server';

import { z } from '@/lib/validations';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

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
        postal_code: payload.postal_code,
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


