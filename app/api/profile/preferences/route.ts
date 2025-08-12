import { NextRequest, NextResponse } from 'next/server';

import { z } from '@/lib/validations';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const preferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  marketing_opt_in: z.boolean().optional(),
  size_preference: z.string().trim().max(10).optional().nullable(),
  language: z.string().trim().max(10).optional().nullable(),
  currency: z.string().trim().max(3).optional().nullable(),
});

export async function GET() {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
    const { data } = await supabase
      .from('user_preferences' as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ preferences: data || null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = await createClient();

    // Upsert preferences
    const payload = {
      user_id: user.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const { data, error } = await supabase
      .from('user_preferences' as any)
      .upsert(payload, { onConflict: 'user_id' } as any)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });

    return NextResponse.json({ preferences: data });
  } catch {
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}


