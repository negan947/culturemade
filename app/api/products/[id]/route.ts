import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for product ID
const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

// Type definitions for product detail API response
interface ProductVariant {
  id: string;
  name: string;
  price: string | null;
  quantity: number;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  position: number;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  primary_image: ProductImage | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  created_at: string;
  updated_at: string | null;
  variants: ProductVariant[];
  categories: ProductCategory[];
  images: ProductImage[];
  related_products: RelatedProduct[];
  total_inventory: number;
  min_price: string;
  max_price: string;
}

interface ProductDetailResponse {
  success: boolean;
  data: ProductDetail | null;
}

// Track product view analytics
async function trackProductView(productId: string, request: NextRequest) {
  try {
    const supabase = await createClient();
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'product_view',
        product_id: productId,
        user_agent: userAgent,
        ip_address: ip,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    // Analytics errors should not affect the main response
    console.warn('Failed to track product view:', error);
  }
}

// GET - Get single product with all details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product ID
    const validation = productIdSchema.safeParse({ id: params.id });
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product ID format',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const productId = validation.data.id;
    const supabase = await createClient();

    // Fetch product with all related data
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compare_at_price,
        status,
        featured,
        created_at,
        updated_at,
        product_variants(
          id,
          name,
          price,
          quantity,
          sku,
          option1,
          option2,
          position
        ),
        product_categories(
          categories(
            id,
            name,
            slug,
            description
          )
        ),
        product_images(
          id,
          url,
          alt_text,
          position
        )
      `)
      .eq('id', productId)
      .eq('status', 'active') // Only return active products for customers
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Product not found'
          },
          { status: 404 }
        );
      }
      
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch product',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Get related products (same category, excluding current product)
    let relatedProducts: RelatedProduct[] = [];
    
    if (product.product_categories && product.product_categories.length > 0) {
      const categoryIds = product.product_categories.map(pc => pc.categories.id);
      
      const { data: relatedData } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          compare_at_price,
          product_categories!inner(category_id),
          product_images(
            id,
            url,
            alt_text,
            position
          )
        `)
        .in('product_categories.category_id', categoryIds)
        .neq('id', productId)
        .eq('status', 'active')
        .limit(6);

      if (relatedData) {
        relatedProducts = relatedData.map(relatedProduct => ({
          id: relatedProduct.id,
          name: relatedProduct.name,
          slug: relatedProduct.slug,
          price: relatedProduct.price,
          compare_at_price: relatedProduct.compare_at_price,
          primary_image: relatedProduct.product_images?.[0] || null,
        }));
      }
    }

    // Calculate inventory and price range
    const variants = product.product_variants || [];
    const images = product.product_images || [];
    const categories = product.product_categories?.map(pc => pc.categories) || [];

    const totalInventory = variants.reduce((sum, variant) => 
      sum + (variant.quantity || 0), 0
    );

    const variantPrices = variants
      .map(v => parseFloat(v.price || product.price))
      .filter(price => !isNaN(price));
    
    const minPrice = variantPrices.length > 0 
      ? Math.min(...variantPrices).toFixed(2)
      : product.price;
    
    const maxPrice = variantPrices.length > 0 
      ? Math.max(...variantPrices).toFixed(2)
      : product.price;

    // Sort variants and images by position
    const sortedVariants = variants.sort((a, b) => a.position - b.position);
    const sortedImages = images.sort((a, b) => a.position - b.position);

    // Build response
    const productDetail: ProductDetail = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compare_at_price: product.compare_at_price,
      status: product.status,
      featured: product.featured,
      created_at: product.created_at,
      updated_at: product.updated_at,
      variants: sortedVariants,
      categories: categories.filter(Boolean),
      images: sortedImages,
      related_products: relatedProducts,
      total_inventory: totalInventory,
      min_price: minPrice,
      max_price: maxPrice,
    };

    // Track product view (async, don't await)
    trackProductView(productId, request);

    const response: ProductDetailResponse = {
      success: true,
      data: productDetail,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Product detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}