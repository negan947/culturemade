import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schemas

const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format')
});

async function requireAdmin() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }

  return { user, supabase };
}

async function logAdminAction(supabase: any, adminId: string, action: string, details: any) {
  try {
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        details
      });
  } catch (error: any) {
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    
    const resolvedParams = await params;
    const validation = productIdSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { id: _id } = validation.data;
    
    try {
      await request.json();
    } catch (_parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // TODO: Add PUT implementation here
    // Using supabase variable to avoid unused warning
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'PUT endpoint not yet implemented' },
      { status: 501 }
    );

  } catch (error: any) {
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAdmin();
    
    const resolvedParams = await params;
    const validation = productIdSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    // First verify product exists and get details for logging
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has any orders (prevent deletion if so)
    // First get variant IDs
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id);
    
    const variantIds = variants?.map(v => v.id) || [];
    
    const { data: orderItems, error: orderCheckError } = variantIds.length > 0 
      ? await supabase
          .from('order_items')
          .select('id')
          .in('product_variant_id', variantIds)
          .limit(1)
      : { data: null, error: null };

    if (orderCheckError) {

      return NextResponse.json(
        { error: 'Failed to verify product usage' },
        { status: 500 }
      );
    }

    if (orderItems && orderItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been ordered. Consider archiving instead.' },
        { status: 409 }
      );
    }

    // Delete related data in proper order (due to foreign key constraints)
    // 1. Delete product images
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id);

    // 2. Delete product variants
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    // 3. Delete product categories
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', id);

    // 4. Delete the product itself
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {

      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, user.id, 'delete_product', {
      product_id: id,
      product_name: existingProduct.name,
      product_sku: existingProduct.sku
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}