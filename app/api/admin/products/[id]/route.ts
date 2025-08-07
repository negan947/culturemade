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
    const { user, supabase } = await requireAdmin();
    
    const resolvedParams = await params;
    const validation = productIdSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { id: _id } = validation.data;
    
    let body;
    try {
      body = await request.json();
      console.log('=== PRODUCT UPDATE DEBUG START ===');
      console.log('API - Product ID:', _id);
      console.log('API - Request method:', request.method);
      console.log('API - Request headers:', Object.fromEntries(request.headers.entries()));
      console.log('API - Received request body (full):', JSON.stringify(body, null, 2));
      
      // Log specific problematic fields
      if (body.images) {
        console.log('API - Images array:', body.images);
        console.log('API - Images count:', body.images.length);
        body.images.forEach((img: any, index: number) => {
          console.log(`API - Image ${index}:`, {
            id: img.id,
            url: img.url,
            urlType: typeof img.url,
            urlLength: img.url?.length,
            alt_text: img.alt_text,
            position: img.position,
            _action: img._action
          });
        });
      }
      
      if (body.variants) {
        console.log('API - Variants array:', body.variants);
        console.log('API - Variants count:', body.variants.length);
        body.variants.forEach((variant: any, index: number) => {
          console.log(`API - Variant ${index}:`, {
            id: variant.id,
            name: variant.name,
            quantity: variant.quantity,
            quantityType: typeof variant.quantity,
            position: variant.position,
            positionType: typeof variant.position,
            _action: variant._action
          });
        });
      }
      
    } catch (_parseError) {
      console.error('API - JSON Parse Error:', _parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validation schema for updating product
    const updateProductSchema = z.object({
      name: z.string().min(1, 'Product name is required').max(255).optional(),
      description: z.string().nullable().optional(),
      status: z.enum(['active', 'draft', 'archived']).optional(),
      price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Invalid price').optional(),
      compare_at_price: z.string().nullable().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid compare price'),
      cost: z.string().nullable().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid cost price'),
      sku: z.string().nullable().optional(),
      barcode: z.string().nullable().optional(),
      featured: z.boolean().optional(),
      track_quantity: z.boolean().optional(),
      allow_backorder: z.boolean().optional(),
      weight: z.string().nullable().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid weight'),
      category_ids: z.array(z.string().uuid()).optional(),
      variants: z.array(z.object({
        id: z.string().optional().refine((val) => {
          // Allow temp IDs for new variants or valid UUIDs for existing variants
          if (!val) return true; // Optional field
          if (val.startsWith('temp-')) return true; // Allow temporary IDs for new variants
          // UUID regex validation
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }, 'Invalid variant ID format'),
        name: z.string().min(1, 'Variant name is required'),
        option1: z.string().nullable().optional(),
        option2: z.string().nullable().optional(),
        option3: z.string().nullable().optional(),
        price: z.string().nullable().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Invalid variant price'),
        sku: z.string().nullable().optional(),
        quantity: z.number().int().min(0, 'Quantity must be non-negative'),
        position: z.number().int().default(1),
        _action: z.enum(['create', 'update', 'delete']).optional().default('update') // For tracking what to do with variant
      })).optional(),
      images: z.array(z.object({
        id: z.string().optional().refine((val) => {
          // Allow temp IDs for new images or valid UUIDs for existing images
          if (!val) return true; // Optional field
          if (val.startsWith('temp-')) return true; // Allow temporary IDs for new images
          // UUID regex validation
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }, 'Invalid image ID format'),
        url: z.string().min(1, 'Image URL is required').refine((url) => {
          // More flexible URL validation for development and Supabase storage
          try {
            // Allow data URLs for base64 images
            if (url.startsWith('data:image/')) {
              return true;
            }
            
            // Allow localhost for development
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
              return true;
            }
            
            // Use URL constructor for validation - more lenient than Zod's .url()
            const parsedUrl = new URL(url);
            
            // Must be HTTP or HTTPS
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
              return false;
            }
            
            // Must have a hostname
            if (!parsedUrl.hostname) {
              return false;
            }
            
            return true;
          } catch {
            return false;
          }
        }, 'Invalid image URL format'),
        alt_text: z.string().nullable().optional(),
        position: z.number().int().default(0),
        _action: z.enum(['create', 'update', 'delete']).optional().default('update')
      })).optional()
    });

    console.log('API - Starting validation...');
    const validationResult = updateProductSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('=== VALIDATION FAILED ===');
      console.error('API - Total validation errors:', validationResult.error.errors.length);
      console.error('API - Validation errors (full):', JSON.stringify(validationResult.error.errors, null, 2));
      
      // Enhanced error logging with field-specific details
      validationResult.error.errors.forEach((error, index) => {
        console.error(`API - Error ${index + 1}:`, {
          path: error.path,
          message: error.message,
          code: error.code,
          received: (error as any).received,
          expected: (error as any).expected
        });
        
        // Special handling for array/object validation errors
        if (error.path.length > 0) {
          const fieldPath = error.path.join('.');
          const fieldValue = error.path.reduce((obj, key) => obj?.[key], body);
          console.error(`API - Field "${fieldPath}" value:`, fieldValue);
          console.error(`API - Field "${fieldPath}" type:`, typeof fieldValue);
          
          // Extra debugging for images
          if (error.path.includes('images')) {
            console.error(`API - Images array structure:`, body.images);
            if (body.images && Array.isArray(body.images)) {
              body.images.forEach((img: any, imgIndex: number) => {
                console.error(`API - Image ${imgIndex} detailed:`, {
                  hasId: 'id' in img,
                  idValue: img.id,
                  idType: typeof img.id,
                  hasUrl: 'url' in img,
                  urlValue: img.url,
                  urlType: typeof img.url,
                  hasPosition: 'position' in img,
                  positionValue: img.position,
                  positionType: typeof img.position,
                  hasAltText: 'alt_text' in img,
                  altTextValue: img.alt_text,
                  altTextType: typeof img.alt_text,
                  hasAction: '_action' in img,
                  actionValue: img._action,
                  actionType: typeof img._action,
                  allKeys: Object.keys(img)
                });
              });
            }
          }
          
          // Extra debugging for variants
          if (error.path.includes('variants')) {
            console.error(`API - Variants array structure:`, body.variants);
            if (body.variants && Array.isArray(body.variants)) {
              body.variants.forEach((variant: any, varIndex: number) => {
                console.error(`API - Variant ${varIndex} detailed:`, {
                  hasId: 'id' in variant,
                  idValue: variant.id,
                  idType: typeof variant.id,
                  hasName: 'name' in variant,
                  nameValue: variant.name,
                  nameType: typeof variant.name,
                  hasQuantity: 'quantity' in variant,
                  quantityValue: variant.quantity,
                  quantityType: typeof variant.quantity,
                  hasPosition: 'position' in variant,
                  positionValue: variant.position,
                  positionType: typeof variant.position,
                  allKeys: Object.keys(variant)
                });
              });
            }
          }
        }
      });
      
      console.error('=== END VALIDATION ERRORS ===');
      
      return NextResponse.json(
        { 
          error: 'Invalid product data', 
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: typeof (err as any).received !== 'undefined' ? (err as any).received : 'undefined'
          }))
        },
        { status: 400 }
      );
    }
    
    console.log('API - Validation passed, parsed data:', validationResult.data);

    const { category_ids, variants, images, ...productData } = validationResult.data;
    const productId = resolvedParams.id;

    // First check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update main product data
    if (Object.keys(productData).length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Product update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update product' },
          { status: 500 }
        );
      }
    }

    // Handle category updates
    if (category_ids !== undefined) {
      // Remove existing categories
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);

      // Add new categories
      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map(categoryId => ({
          product_id: productId,
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

    // Handle variant updates
    if (variants !== undefined) {
      for (const variant of variants) {
        const action = variant._action || (variant.id ? 'update' : 'create');
        
        if (action === 'delete' && variant.id) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('id', variant.id)
            .eq('product_id', productId);
            
        } else if (action === 'update' && variant.id) {
          const { _action, ...variantData } = variant;
          await supabase
            .from('product_variants')
            .update({
              ...variantData,
              updated_at: new Date().toISOString()
            })
            .eq('id', variant.id)
            .eq('product_id', productId);
            
        } else if (action === 'create') {
          const { _action, id, ...variantData } = variant;
          await supabase
            .from('product_variants')
            .insert({
              ...variantData,
              product_id: productId
            });
        }
      }
    }

    // Handle image updates
    if (images !== undefined) {
      for (const image of images) {
        const action = image._action || (image.id ? 'update' : 'create');
        
        if (action === 'delete' && image.id) {
          await supabase
            .from('product_images')
            .delete()
            .eq('id', image.id)
            .eq('product_id', productId);
            
        } else if (action === 'update' && image.id) {
          const { _action, ...imageData } = image;
          await supabase
            .from('product_images')
            .update(imageData)
            .eq('id', image.id)
            .eq('product_id', productId);
            
        } else if (action === 'create') {
          const { _action, id, ...imageData } = image;
          await supabase
            .from('product_images')
            .insert({
              ...imageData,
              product_id: productId
            });
        }
      }
    }

    // Log admin action
    await logAdminAction(supabase, user.id, 'update_product', {
      product_id: productId,
      product_name: existingProduct.name,
      updated_fields: Object.keys(productData),
      variant_updates: variants?.length || 0,
      image_updates: images?.length || 0,
      category_updates: category_ids?.length || 0
    });

    // Fetch updated product with all relations
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_categories(
          categories(id, name, slug)
        ),
        product_images(*)
      `)
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Fetch updated product error:', fetchError);
      return NextResponse.json(
        { error: 'Product updated but failed to fetch updated data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error: any) {
    console.error('API - Unexpected error in PUT handler:', error);
    console.error('API - Error stack:', error.stack);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
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