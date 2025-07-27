import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for upload request
const uploadSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  altText: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return { valid: true };
}

async function getNextPosition(supabase: any, productId: string): Promise<number> {
  const { data } = await supabase
    .from('product_images')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0].position + 1 : 1;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const productId = formData.get('productId') as string;
    const altText = formData.get('altText') as string | null;

    // Validate request data
    const validation = uploadSchema.safeParse({
      productId,
      altText: altText || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadResults = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      const fileValidation = await validateFile(file);
      if (!fileValidation.valid) {
        errors.push({
          file: file.name,
          error: fileValidation.error
        });
        continue;
      }

      try {
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `product-${productId}-${Date.now()}-${i}.${fileExtension}`;
        const filePath = `products/${productId}/${fileName}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          errors.push({
            file: file.name,
            error: `Upload failed: ${uploadError.message}`
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        // Get next position
        const position = await getNextPosition(supabase, productId);

        // Save image record to database
        const { data: imageData, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            alt_text: altText,
            position,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from('product-images')
            .remove([filePath]);

          errors.push({
            file: file.name,
            error: `Database error: ${dbError.message}`
          });
          continue;
        }

        uploadResults.push({
          file: file.name,
          imageId: imageData.id,
          imageUrl: imageData.image_url,
          position: imageData.position
        });

      } catch (error) {
        console.error('Upload error:', error);
        errors.push({
          file: file.name,
          error: 'Unexpected error during upload'
        });
      }
    }

    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action: 'upload_product_images',
        details: {
          product_id: productId,
          uploaded_count: uploadResults.length,
          error_count: errors.length
        }
      });

    // Return results
    return NextResponse.json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadResults.length} of ${files.length} files uploaded successfully`
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing images
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      );
    }

    // Get image details
    const { data: imageData, error: fetchError } = await supabase
      .from('product_images')
      .select('id, product_id, image_url')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const url = new URL(imageData.image_url);
    const filePath = url.pathname.split('/').slice(-3).join('/'); // products/{id}/{filename}

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to delete image record' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action: 'delete_product_image',
        details: {
          image_id: imageId,
          product_id: imageData.product_id
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}