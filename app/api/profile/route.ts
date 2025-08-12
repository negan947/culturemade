import { NextRequest, NextResponse } from 'next/server';

import { z } from '@/lib/validations';
import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .nullable(),
});

export async function GET() {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Attempt to fetch preferences if table exists (will fail gracefully if not present)
    let preferences: any = null;
    try {
      const { data: prefs } = await supabase
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();
      preferences = prefs ?? null;
    } catch {
      preferences = null;
    }

    return NextResponse.json({ profile, preferences });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const updates = parsed.data;
    if (!updates.full_name && typeof updates.phone === 'undefined') {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch existing profile for change history diff
    const { data: beforeProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Record change history (best-effort)
    try {
      const userAgent = request.headers.get('user-agent');
      const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        null;

      await supabase
        .from('profile_change_history' as any)
        .insert({
          user_id: user.id,
          changed_by: user.id,
          changes: {
            before: beforeProfile || null,
            after: { full_name: updated.full_name, phone: updated.phone },
          },
          ip_address: ip,
          user_agent: userAgent,
        } as any);
    } catch {
      // ignore if table not present or RLS prevents insert
    }

    return NextResponse.json({ profile: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}


