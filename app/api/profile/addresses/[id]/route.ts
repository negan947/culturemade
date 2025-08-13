import { NextRequest, NextResponse } from 'next/server';

import { z } from '@/lib/validations';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const uuidSchema = z.string().uuid('Invalid address ID');

const addressUpdateSchema = z.object({
  type: z.enum(['billing', 'shipping', 'both']).optional(),
  is_default: z.boolean().optional(),
  first_name: z.string().trim().min(1).max(50).optional(),
  last_name: z.string().trim().min(1).max(50).optional(),
  company: z.string().trim().max(100).optional().nullable(),
  address_line_1: z.string().trim().min(3).max(120).optional(),
  address_line_2: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().min(1).max(80).optional(),
  state_province: z.string().trim().min(2).max(80).optional(),
  postal_code: z.string().trim().min(3).max(20).optional(),
  country_code: z.string().trim().toUpperCase().length(2).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .nullable(),
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const idCheck = uuidSchema.safeParse(params.id);
    if (!idCheck.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const parsed = addressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = await createClient();

    // Enforce ownership via RLS and user_id equality in update
    const updates = { ...parsed.data } as Record<string, unknown>;
    if (updates.country_code && updates.postal_code) {
      const normalized = normalizePostal(String(updates.country_code), String(updates.postal_code));
      if (!validatePostalByCountry(String(updates.country_code), normalized)) {
        return NextResponse.json(
          { error: 'Invalid postal/ZIP code for selected country' },
          { status: 400 }
        );
      }
      updates.postal_code = normalized;
    }

    // If setting default, clear others for this type
    if (updates.is_default === true && (updates.type === 'billing' || updates.type === 'shipping' || updates.type === 'both')) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .in('type', [updates.type, 'both']);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });

    return NextResponse.json({ address: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const idCheck = uuidSchema.safeParse(params.id);
    if (!idCheck.success) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const supabase = await createClient();

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}


