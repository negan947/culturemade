import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schemas for admin operations
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Invalid price'),
  compare_at_price: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid compare price'),
  cost_price: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid cost price'),
  sku: z.string().optional(),
  featured: z.boolean().default(false),
  track_inventory: z.boolean().default(true),
  continue_selling_when_out_of_stock: z.boolean().default(false),
  category_ids: z.array(z.string().uuid()).optional(),
  variants: z.array(z.object({
    title: z.string().min(1),
    option1: z.string().optional(),
    option2: z.string().optional(),
    option3: z.string().optional(),
    price: z.string().optional(),
    compare_at_price: z.string().optional(),
    cost_price: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0),
    position: z.number().int().default(1)
  })).optional()
});

// const updateProductSchema = createProductSchema.partial();

const listProductsSchema = z.object({
  page: z.string().optional().transform((val) => val ? Math.max(1, parseInt(val)) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(100, Math.max(1, parseInt(val))) : 20),
  search: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  category: z.string().uuid().optional(),
  sort: z.enum(['name', 'price', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
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

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    
    const body = await request.json();
    const validation = createProductSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category_ids, variants, ...productData } = validation.data;

    // Start transaction for product creation
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (productError) {

      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Add category associations
    if (category_ids && category_ids.length > 0) {
      const categoryInserts = category_ids.map(categoryId => ({
        product_id: product.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('product_categories')
        .insert(categoryInserts);

      if (categoryError) {

        // Don't fail the entire operation, just log the error
      }
    }

    // Add product variants
    if (variants && variants.length > 0) {
      const variantInserts = variants.map((variant, index) => ({
        ...variant,
        product_id: product.id,
        position: variant.position || index + 1
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantError) {

        // Don't fail the entire operation, just log the error
      }
    }

    await logAdminAction(supabase, user.id, 'create_product', {
      product_id: product.id,
      product_name: product.name,
      category_count: category_ids?.length || 0,
      variant_count: variants?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    }, { status: 201 });

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