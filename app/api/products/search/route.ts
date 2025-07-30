import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  page: z.string().nullable().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().nullable().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  category: z.string().uuid().nullable().optional(),
  min_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  max_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  sort: z.enum(['relevance', 'price', 'name', 'created_at']).nullable().optional().default('relevance'),
  direction: z.enum(['asc', 'desc']).nullable().optional().default('desc'),
  suggest: z.string().nullable().optional().transform((val) => val === 'true'),
});

// Type definitions for search API responses
interface SearchSuggestion {
  id: string;
  name: string;
  price: string;
  primary_image: {
    id: string;
    url: string;
    alt_text: string | null;
  } | null;
}

interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  featured: boolean;
  min_price: string;
  max_price: string;
  total_inventory: number;
  primary_image: {
    id: string;
    url: string;
    alt_text: string | null;
    position: number;
  } | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  relevance_score?: number;
}

interface SearchResponse {
  success: boolean;
  data: SearchResultItem[];
  suggestions?: SearchSuggestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  search_info: {
    query: string;
    suggestions_only: boolean;
    filters_applied: string[];
    search_time_ms: number;
  };
}

// Track search analytics
async function trackSearchEvent(query: string, resultCount: number, request: NextRequest) {
  try {
    const supabase = await createClient();
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'product_search',
        search_query: query,
        result_count: resultCount,
        user_agent: userAgent,
        ip_address: ip,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    // Analytics errors should not affect the main response
    console.warn('Failed to track search event:', error);
  }
}

// GET - Search products with advanced filtering and suggestions
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate search parameters
    const validation = searchParamsSchema.safeParse({
      q: searchParams.get('q'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      min_price: searchParams.get('min_price'),
      max_price: searchParams.get('max_price'),
      sort: searchParams.get('sort'),
      direction: searchParams.get('direction'),
      suggest: searchParams.get('suggest'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    const supabase = await createClient();
    const searchQuery = params.q.trim();

    // If suggestions only, return quick suggestions
    if (params.suggest) {
      const { data: suggestions } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          product_images(
            id,
            url,
            alt_text,
            position
          )
        `)
        .ilike('name', `%${searchQuery}%`)
        .eq('status', 'active')
        .order('name', { ascending: true })
        .limit(8);

      const searchSuggestions: SearchSuggestion[] = (suggestions || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        primary_image: product.product_images?.[0] || null,
      }));

      return NextResponse.json({
        success: true,
        data: [],
        suggestions: searchSuggestions,
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
        search_info: {
          query: searchQuery,
          suggestions_only: true,
          filters_applied: [],
          search_time_ms: Date.now() - startTime,
        },
      });
    }

    // Build full-text search query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compare_at_price,
        featured,
        created_at,
        product_variants(
          id,
          name,
          price,
          quantity
        ),
        product_categories(
          categories(
            id,
            name,
            slug
          )
        ),
        product_images(
          id,
          url,
          alt_text,
          position
        )
      `)
      .eq('status', 'active');

    // Apply search filter using multiple approaches for better results
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length > 0) {
      // Use PostgreSQL full-text search if available, fallback to ILIKE
      const searchConditions = searchTerms.map(term => 
        `name.ilike.%${term}%,description.ilike.%${term}%`
      ).join(',');
      
      query = query.or(searchConditions);
    }

    // Apply category filter
    const filtersApplied: string[] = [];
    
    if (params.category) {
      const productsInCategory = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', params.category);
      
      if (productsInCategory.data && productsInCategory.data.length > 0) {
        const productIds = productsInCategory.data.map(pc => pc.product_id);
        query = query.in('id', productIds);
        filtersApplied.push('category');
      } else {
        // No products in this category
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: params.page,
            limit: params.limit,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
          },
          search_info: {
            query: searchQuery,
            suggestions_only: false,
            filters_applied: filtersApplied,
            search_time_ms: Date.now() - startTime,
          },
        });
      }
    }

    // Apply price range filters
    if (params.min_price !== undefined) {
      query = query.gte('price', params.min_price);
      filtersApplied.push('min_price');
    }
    if (params.max_price !== undefined) {
      query = query.lte('price', params.max_price);
      filtersApplied.push('max_price');
    }

    // Apply sorting
    if (params.sort === 'relevance') {
      // For relevance, prioritize exact matches, then partial matches
      // In a more advanced implementation, you would use ts_rank for full-text search
      query = query.order('featured', { ascending: false })
                  .order('name', { ascending: true });
    } else if (params.sort === 'price') {
      query = query.order('price', { ascending: params.direction === 'asc' });
    } else if (params.sort === 'name') {
      query = query.order('name', { ascending: params.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: params.direction === 'asc' });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Apply search to count query as well (simplified for now)
    const total = count || 0;
    const totalPages = Math.ceil(total / params.limit);

    // Apply pagination
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    
    query = query.range(from, to);

    const { data: products, error } = await query;

    if (error) {
      console.error('Search database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Search failed',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Transform search results
    const searchResults: SearchResultItem[] = (products || []).map((product: any) => {
      const variants = product.product_variants || [];
      const images = product.product_images || [];
      const categories = product.product_categories?.map((pc: any) => pc.categories) || [];

      // Calculate price range and inventory
      const variantPrices = variants
        .map((v: any) => parseFloat(v.price || product.price))
        .filter((price: number) => !isNaN(price));
      
      const minPrice = variantPrices.length > 0 
        ? Math.min(...variantPrices).toFixed(2)
        : product.price;
      
      const maxPrice = variantPrices.length > 0 
        ? Math.max(...variantPrices).toFixed(2)
        : product.price;

      const totalInventory = variants.reduce((sum: number, variant: any) => 
        sum + (variant.quantity || 0), 0
      );

      // Get primary image
      const primaryImage = images.length > 0 
        ? images.sort((a: any, b: any) => a.position - b.position)[0]
        : null;

      // Calculate basic relevance score based on search term position in name
      let relevanceScore = 0;
      const lowerName = product.name.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      
      if (lowerName.includes(lowerQuery)) {
        const position = lowerName.indexOf(lowerQuery);
        relevanceScore = position === 0 ? 100 : Math.max(50 - position, 10);
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        compare_at_price: product.compare_at_price,
        featured: product.featured,
        min_price: minPrice,
        max_price: maxPrice,
        total_inventory: totalInventory,
        primary_image: primaryImage,
        categories: categories.filter(Boolean),
        relevance_score: relevanceScore,
      };
    });

    // Sort by relevance if that was requested
    if (params.sort === 'relevance') {
      searchResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }

    // Track search analytics (don't await)
    trackSearchEvent(searchQuery, searchResults.length, request);

    const response: SearchResponse = {
      success: true,
      data: searchResults,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        total_pages: totalPages,
        has_next: params.page < totalPages,
        has_prev: params.page > 1,
      },
      search_info: {
        query: searchQuery,
        suggestions_only: false,
        filters_applied: filtersApplied,
        search_time_ms: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Product search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}