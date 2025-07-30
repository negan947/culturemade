/**
 * Products API Route - Fetches products from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { ProductListItem } from '@/types/api';

/**
 * GET /api/products - Get all products with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');

    const supabase = await createClient();

    // Build Supabase query for products with related data
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_at_price,
        featured,
        created_at,
        updated_at,
        product_variants(price, quantity),
        product_images(id, url, alt_text, position),
        product_categories(
          categories(id, name, slug)
        )
      `)
      .eq('status', 'active');

    // Add filters
    if (category) {
      query = query.eq('product_categories.categories.slug', category);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add pagination and ordering
    query = query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: productsData, error: productsError, count } = await query;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Transform the Supabase results into ProductListItem format
    const products: ProductListItem[] = (productsData || []).map((product: any) => {
      // Calculate min/max price from variants
      const variantPrices = product.product_variants?.map((v: any) => parseFloat(v.price)) || [];
      const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : parseFloat(product.price);
      const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : parseFloat(product.price);
      
      // Calculate total inventory
      const totalInventory = product.product_variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      
      // Get primary image (first image by position)
      const primaryImage = product.product_images?.find((img: any) => img.position === 1) 
        || product.product_images?.[0] 
        || null;
      
      // Get categories
      const categories = product.product_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_at_price: product.compare_at_price,
        min_price: minPrice.toString(),
        max_price: maxPrice.toString(),
        total_inventory: totalInventory,
        featured: product.featured || false,
        primary_image: primaryImage,
        categories: categories,
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    });

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) {
      console.warn('Failed to get total count:', countError.message);
    }

    const total = totalCount || 0;

    return NextResponse.json({
      products,
      pagination: {
        total: parseInt(total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(total)
      }
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}