import { NextRequest, NextResponse } from 'next/server';

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
	return { supabase };
}

export async function GET(request: NextRequest) {
	try {
		await requireAdmin();
		const { searchParams } = new URL(request.url);
		const variantId = searchParams.get('variant_id');
		const productId = searchParams.get('product_id');
		const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

		const supabase = await createClient();
		let query = supabase
			.from('inventory_movements')
			.select('id, variant_id, type, quantity, reference_type, reference_id, notes, created_at')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (variantId) {
			query = query.eq('variant_id', variantId);
		} else if (productId) {
			// Filter by variants that belong to the product
			const { data: variants } = await supabase
				.from('product_variants')
				.select('id')
				.eq('product_id', productId);
			const variantIds = (variants || []).map(v => v.id);
			if (variantIds.length > 0) {
				query = query.in('variant_id', variantIds);
			} else {
				return NextResponse.json({ data: [] });
			}
		}

		const { data, error } = await query;
		if (error) return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 });
		return NextResponse.json({ data });
	} catch (error: any) {
		if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		if (error.message.includes('Forbidden')) return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}


