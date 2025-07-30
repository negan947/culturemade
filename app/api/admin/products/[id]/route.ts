import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schemas
const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.union([z.string(), z.null()]).optional(),
  status: z.enum(['active', 'draft', 'archived']),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Invalid price'),
  compare_at_price: z.union([z.string(), z.null()]).optional(),
  cost: z.union([z.string(), z.null()]).optional(),
  sku: z.union([z.string(), z.null()]).optional(),
  featured: z.boolean(),
  track_quantity: z.boolean(),
  allow_backorder: z.boolean(),
  category_ids: z.array(z.string().uuid()).optional(),
  variants: z.array(z.object({
    id: z.string().uuid().optional(), // For updating existing variants
    title: z.string().min(1),
    option1: z.string().optional(),
    option2: z.string().optional(),
    option3: z.string().optional(),
    price: z.string().optional(),
    compare_at_price: z.string().optional(),
    cost_price: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0),
    position: z.number().int().default(1),
    _action: z.enum(['create', 'update', 'delete']).optional() // Action for variant
  })).optional()
});

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
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// GET - Get single product with all details
export async function GET(
  request: NextRequest,
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

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_categories(categories(id, name, slug)),
        product_images(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, user.id, 'view_product', {
      product_id: id,
      product_name: product.name
    });

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Admin product GET error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
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
    
    let body;
    try {
      body = await request.json();
      console.log('Received request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const updateValidation = updateProductSchema.safeParse(body);
    
    if (!updateValidation.success) {
      console.error('Validation Error:', updateValidation.error.errors);
      console.error('Received Data:', body);
      return NextResponse.json(
        { error: 'Invalid update data', details: updateValidation.error.errors },
        { status: 400 }
      );
    }

    const { category_ids, variants, ...productData } = updateValidation.data;

    // First verify product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product data
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Product update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Update category associations if provided
    if (category_ids !== undefined) {
      // Remove existing categories
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', id);

      // Add new categories
      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map(categoryId => ({
          product_id: id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Category update error:', categoryError);
        }
      }
    }

    // Update variants if provided
    if (variants !== undefined) {
      for (const variant of variants) {
        const { _action, id: variantId, ...variantData } = variant;
        
        if (_action === 'delete' && variantId) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('id', variantId)
            .eq('product_id', id);
        } else if (_action === 'update' && variantId) {
          await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', variantId)
            .eq('product_id', id);
        } else if (_action === 'create' || !variantId) {
          await supabase
            .from('product_variants')
            .insert({
              ...variantData,
              product_id: id
            });
        }
      }
    }

    await logAdminAction(supabase, user.id, 'update_product', {
      product_id: id,
      product_name: updatedProduct.name,
      updated_fields: Object.keys(productData),
      category_update: category_ids !== undefined,
      variant_update: variants !== undefined
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Admin product PUT error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
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
    const { data: orderItems, error: orderCheckError } = await supabase
      .from('order_items')
      .select('id')
      .in('product_variant_id', 
        supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', id)
      )
      .limit(1);

    if (orderCheckError) {
      console.error('Order check error:', orderCheckError);
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
      console.error('Product deletion error:', deleteError);
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

  } catch (error) {
    console.error('Admin product DELETE error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}