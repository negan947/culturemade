import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ApiResponse, ProductSearchResult, SearchFacets } from '@/types/ecommerce'

// Search-specific validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query required').max(100, 'Query too long'),
  categoryIds: z.array(z.string().uuid()).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
  minRating: z.number().min(1).max(5).optional(),
  sortBy: z.enum([
    'relevance', 'created_desc', 'created_asc', 'price_asc', 
    'price_desc', 'name_asc', 'name_desc', 'rating_desc'
  ]).default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  facets: z.boolean().default(true)
})

/**
 * GET /api/search - Full-text search with faceted filtering
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - categoryIds: Array of category IDs to filter by
 * - collectionIds: Array of collection IDs to filter by
 * - minPrice, maxPrice: Price range filtering
 * - inStock: Filter by stock availability
 * - onSale: Filter by sale status
 * - featured: Filter by featured status
 * - minRating: Minimum rating filter
 * - sortBy: Sort order (relevance, created_desc, price_asc, etc.)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - facets: Include search facets (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const rawParams = {
      q: searchParams.get('q') || '',
      categoryIds: searchParams.getAll('categoryIds'),
      collectionIds: searchParams.getAll('collectionIds'),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      onSale: searchParams.get('onSale') === 'true' ? true : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      facets: searchParams.get('facets') !== 'false'
    }

    const validatedParams = searchQuerySchema.parse(rawParams)
    
    const supabase = await createClient()
    
    // Use the search_products function for optimized full-text search
    const { data: searchResults, error } = await supabase.rpc('search_products', {
      search_query: validatedParams.q,
      category_ids: validatedParams.categoryIds || null,
      collection_ids: validatedParams.collectionIds || null,
      min_price: validatedParams.minPrice || null,
      max_price: validatedParams.maxPrice || null,
      in_stock_only: validatedParams.inStock || false,
      on_sale_only: validatedParams.onSale || false,
      featured_only: validatedParams.featured || false,
      min_rating: validatedParams.minRating || null,
      sort_by: validatedParams.sortBy,
      page_limit: validatedParams.limit,
      page_offset: (validatedParams.page - 1) * validatedParams.limit
    })
    
    if (error) {
      console.error('Search database error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search operation failed'
        }
      }, { status: 500 })
    }
    
    // Transform search results
    const products = searchResults?.map((product: any) => ({
      ...product,
      // Computed properties
      isOnSale: !!product.compare_at_price && product.compare_at_price > product.price,
      discountPercentage: product.compare_at_price 
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : null,
      isInStock: product.quantity > 0,
      averageRating: product.average_rating || null,
      reviewCount: product.review_count || 0,
      isNew: new Date(product.created_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000),
      isFeatured: product.featured,
      displayPrice: product.price,
      priceRange: null, // TODO: Calculate from variants
      mainImage: product.main_image_url ? { url: product.main_image_url, alt_text: product.name } : null,
      stockStatus: product.quantity > 10 ? 'in_stock' : product.quantity > 0 ? 'low_stock' : 'out_of_stock'
    })) || []
    
    // Get search facets if requested
    let facets: SearchFacets = {
      categories: [],
      collections: [],
      priceRanges: [],
      ratings: []
    }
    
    if (validatedParams.facets && validatedParams.q) {
      try {
        // Get category facets
        const { data: categoryFacets } = await supabase.rpc('get_search_facets', {
          search_query: validatedParams.q,
          facet_type: 'categories'
        })
        
        // Get collection facets
        const { data: collectionFacets } = await supabase.rpc('get_search_facets', {
          search_query: validatedParams.q,
          facet_type: 'collections'
        })
        
        // Get price range facets
        const { data: priceFacets } = await supabase.rpc('get_search_facets', {
          search_query: validatedParams.q,
          facet_type: 'price_ranges'
        })
        
        // Get rating facets
        const { data: ratingFacets } = await supabase.rpc('get_search_facets', {
          search_query: validatedParams.q,
          facet_type: 'ratings'
        })
        
        facets = {
          categories: categoryFacets || [],
          collections: collectionFacets || [],
          priceRanges: priceFacets || [],
          ratings: ratingFacets || []
        }
      } catch (facetError) {
        console.warn('Failed to load search facets:', facetError)
        // Continue without facets rather than failing the entire request
      }
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase.rpc('count_search_results', {
      search_query: validatedParams.q,
      category_ids: validatedParams.categoryIds || null,
      collection_ids: validatedParams.collectionIds || null,
      min_price: validatedParams.minPrice || null,
      max_price: validatedParams.maxPrice || null,
      in_stock_only: validatedParams.inStock || false,
      on_sale_only: validatedParams.onSale || false,
      featured_only: validatedParams.featured || false,
      min_rating: validatedParams.minRating || null
    })
    
    const hasMore = (validatedParams.page * validatedParams.limit) < (totalCount || 0)
    
    const result: ProductSearchResult = {
      products,
      totalCount: totalCount || 0,
      hasMore,
      filters: {
        query: validatedParams.q,
        categoryIds: validatedParams.categoryIds,
        collectionIds: validatedParams.collectionIds,
        minPrice: validatedParams.minPrice,
        maxPrice: validatedParams.maxPrice,
        inStock: validatedParams.inStock,
        onSale: validatedParams.onSale,
        featured: validatedParams.featured,
        minRating: validatedParams.minRating,
        sortBy: validatedParams.sortBy as any,
        limit: validatedParams.limit,
        offset: (validatedParams.page - 1) * validatedParams.limit
      },
      facets
    }
    
    const response: ApiResponse<ProductSearchResult> = {
      success: true,
      data: result,
      meta: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: totalCount || 0,
        hasMore
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360' // Cache for 3 minutes
      }
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: error.message
        }
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Search request failed'
      }
    }, { status: 500 })
  }
} 