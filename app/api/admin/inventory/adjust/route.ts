import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) throw new Error('Unauthorized');
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();
	if (!profile || profile.role !== 'admin') throw new Error('Forbidden - Admin access required');
	return { user, supabase };
}

const adjustmentSchema = z.object({
	variant_id: z.string().uuid(),
	adjustment: z.number().int(), // can be negative
	notes: z.string().optional(),
	reference_type: z.enum(['purchase', 'sale', 'return', 'adjustment', 'damage']).optional().default('adjustment'),
	reference_id: z.string().uuid().optional(),
});

const requestSchema = z.object({
	adjustments: z.array(adjustmentSchema).min(1),
});

export async function POST(request: NextRequest) {
	try {
		const { user, supabase } = await requireAdmin();
		const body = await request.json();
		const parsed = requestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: 'Invalid request', details: parsed.error.errors }, { status: 400 });
		}

		for (const adj of parsed.data.adjustments) {
			const { data: variantRow, error: vErr } = await supabase
				.from('product_variants')
				.select('quantity')
				.eq('id', adj.variant_id)
				.maybeSingle();
			if (vErr) {
				return NextResponse.json({ error: 'Failed to fetch variant' }, { status: 500 });
			}
			const currentQty = Number(variantRow?.quantity ?? 0);
			const newQty = Math.max(currentQty + adj.adjustment, 0);
			const { error: uErr } = await supabase
				.from('product_variants')
				.update({ quantity: newQty, updated_at: new Date().toISOString() })
				.eq('id', adj.variant_id);
			if (uErr) {
				return NextResponse.json({ error: 'Failed to update variant quantity' }, { status: 500 });
			}
			await supabase.from('inventory_movements').insert({
				variant_id: adj.variant_id,
				type: adj.reference_type || 'adjustment',
				quantity: adj.adjustment,
				reference_type: adj.reference_type || 'adjustment',
				reference_id: adj.reference_id || null,
				notes: adj.notes || null,
				created_by: user.id,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error: any) {
		if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		if (error.message.includes('Forbidden')) return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}


