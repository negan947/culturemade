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

const bulkActionSchema = z.object({
	action: z.enum(['activate', 'deactivate', 'delete']),
	ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest) {
	try {
		const { user, supabase } = await requireAdmin();
		const body = await request.json();
		const parsed = bulkActionSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: 'Invalid request', details: parsed.error.errors }, { status: 400 });
		}
		const { action, ids } = parsed.data;

		if (action === 'delete') {
			// For deletes, ensure no order items reference any variants of these products
			const { data: variants } = await supabase
				.from('product_variants')
				.select('id, product_id')
				.in('product_id', ids);
			const variantIds = (variants || []).map(v => v.id);
			if (variantIds.length > 0) {
				const { data: orderItems, error: orderErr } = await supabase
					.from('order_items')
					.select('id')
					.in('variant_id', variantIds)
					.limit(1);
				if (orderErr) {
					return NextResponse.json({ error: 'Failed to verify product usage' }, { status: 500 });
				}
				if (orderItems && orderItems.length > 0) {
					return NextResponse.json({ error: 'One or more products have orders and cannot be deleted. Archive instead.' }, { status: 409 });
				}
			}

			// Delete related data first: images, variants, categories, then products
			await supabase.from('product_images').delete().in('product_id', ids);
			await supabase.from('product_variants').delete().in('product_id', ids);
			await supabase.from('product_categories').delete().in('product_id', ids);
			const { error: delErr } = await supabase.from('products').delete().in('id', ids);
			if (delErr) {
				return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
			}
		} else {
			const status = action === 'activate' ? 'active' : 'draft';
			const { error: updErr } = await supabase
				.from('products')
				.update({ status, updated_at: new Date().toISOString() })
				.in('id', ids);
			if (updErr) {
				return NextResponse.json({ error: 'Failed to update products' }, { status: 500 });
			}
		}

		// Log admin action
		await supabase.from('admin_logs').insert({
			admin_id: user.id,
			action: `bulk_products_${action}`,
			details: { ids },
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		if (error.message.includes('Forbidden')) return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}





