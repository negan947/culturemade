import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { productSearchSchema } from '@/lib/validations/ecommerce'
import type { ApiResponse, Product, ProductSearchResult } from '@/types/ecommerce'

/**
 * GET /api/products - Get products with filtering, search, and pagination
 * 
 * Query Parameters:
 * - query: Search term for product name/description
 * - categoryIds: Array of category IDs to filter by
 * - collectionIds: Array of collection IDs to filter by
 * - minPrice, maxPrice: Price range filtering
 * - inStock: Filter by stock availability
 * - onSale: Filter by sale status
 * - featured: Filter by featured status
 * - minRating: Minimum rating filter
 * - sortBy: Sort order (created_desc, price_asc, etc.)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const rawParams = {
      query: searchParams.get('query') || undefined,
      categoryIds: searchParams.getAll('categoryIds'),
      collectionIds: searchParams.getAll('collectionIds'),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      onSale: searchParams.get('onSale') === 'true' ? true : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      sortBy: searchParams.get('sortBy') || 'created_desc',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    // Validate parameters
    const validatedParams = productSearchSchema.parse(rawParams)
    
    const supabase = await createClient()
    
    // Build the base query
    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants!inner(
          id,
          name,
          price,
          sku,
          quantity,
          option1,
          option2,
          option3,
          position
        ),
        product_images(
          id,
          url,
          alt_text,
          position
        ),
        product_categories!inner(
          categories(
            id,
            name,
            slug
          )
        ),
        product_collections(
          collections(
            id,
            name,
            slug
          )
        )
      `)
      .eq('status', 'active') // Only show active products
    
    // Apply text search if query provided
    if (validatedParams.query) {
      query = query.textSearch('search_vector', validatedParams.query)
    }
    
    // Apply category filter
    if (validatedParams.categoryIds && validatedParams.categoryIds.length > 0) {
      query = query.in('product_categories.category_id', validatedParams.categoryIds)
    }
    
    // Apply collection filter
    if (validatedParams.collectionIds && validatedParams.collectionIds.length > 0) {
      query = query.in('product_collections.collection_id', validatedParams.collectionIds)
    }
    
    // Apply price range filter
    if (validatedParams.minPrice !== undefined) {
      query = query.gte('price', validatedParams.minPrice)
    }
    if (validatedParams.maxPrice !== undefined) {
      query = query.lte('price', validatedParams.maxPrice)
    }
    
    // Apply stock filter
    if (validatedParams.inStock) {
      query = query.gt('quantity', 0)
    }
    
    // Apply sale filter (products with compare_at_price)
    if (validatedParams.onSale) {
      query = query.not('compare_at_price', 'is', null)
    }
    
    // Apply featured filter
    if (validatedParams.featured) {
      query = query.eq('featured', true)
    }
    
    // Apply sorting
    switch (validatedParams.sortBy) {
      case 'created_desc':
        query = query.order('created_at', { ascending: false })
        break
      case 'created_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'name_asc':
        query = query.order('name', { ascending: true })
        break
      case 'name_desc':
        query = query.order('name', { ascending: false })
        break
      case 'featured':
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit
    query = query.range(offset, offset + validatedParams.limit - 1)
    
    // Execute query
    const { data: products, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch products'
        }
      }, { status: 500 })
    }
    
    // Transform data to include computed properties
    const transformedProducts: Product[] = products?.map(product => ({
      ...product,
      // Computed properties
      isOnSale: !!product.compare_at_price && product.compare_at_price > product.price,
      discountPercentage: product.compare_at_price 
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : null,
      isInStock: product.quantity > 0,
      averageRating: null, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Calculate from reviews
      isNew: new Date(product.created_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days
      isFeatured: product.featured,
      displayPrice: product.price,
      priceRange: product.product_variants?.length > 1 
        ? {
            min: Math.min(...product.product_variants.map(v => v.price || product.price)),
            max: Math.max(...product.product_variants.map(v => v.price || product.price))
          }
        : null,
      mainImage: product.product_images?.find(img => img.position === 0) || product.product_images?.[0] || null,
      stockStatus: product.quantity > 10 ? 'in_stock' : product.quantity > 0 ? 'low_stock' : 'out_of_stock',
      // Related data
      variants: product.product_variants,
      images: product.product_images,
      categories: product.product_categories?.map(pc => pc.categories).filter(Boolean),
      collections: product.product_collections?.map(pc => pc.collections).filter(Boolean)
    })) || []
    
    // Calculate total count for pagination
    const totalCount = count || 0
    const hasMore = (validatedParams.page * validatedParams.limit) < totalCount
    
    const result: ProductSearchResult = {
      products: transformedProducts,
      totalCount,
      hasMore,
      filters: validatedParams,
      facets: {
        categories: [], // TODO: Calculate facets
        collections: [],
        priceRanges: [],
        ratings: []
      }
    }
    
    const response: ApiResponse<ProductSearchResult> = {
      success: true,
      data: result,
      meta: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: totalCount,
        hasMore
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    })
    
  } catch (error) {
    console.error('Products API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.message
        }
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
} 