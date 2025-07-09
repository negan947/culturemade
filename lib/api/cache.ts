import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Cache configuration for different data types
 */
const CACHE_CONFIG = {
  products: {
    revalidate: 300, // 5 minutes
    tags: ['products']
  },
  categories: {
    revalidate: 600, // 10 minutes
    tags: ['categories']
  },
  search: {
    revalidate: 180, // 3 minutes
    tags: ['search', 'products']
  },
  cart: {
    revalidate: false, // No caching for cart data
    tags: ['cart']
  }
} as const

/**
 * Cache key generators
 */
export const cacheKeys = {
  products: (filters?: Record<string, unknown>) => 
    `products:${filters ? JSON.stringify(filters) : 'all'}`,
  
  product: (id: string) => 
    `product:${id}`,
  
  categories: (params?: Record<string, unknown>) => 
    `categories:${params ? JSON.stringify(params) : 'all'}`,
  
  search: (query: string, filters?: Record<string, unknown>) => 
    `search:${query}:${filters ? JSON.stringify(filters) : 'no-filters'}`,
  
  cart: (userId?: string, sessionId?: string) => 
    `cart:${userId || sessionId || 'anonymous'}`
}

/**
 * Cached product fetching
 */
export const getCachedProducts = unstable_cache(
  async (filters: Record<string, unknown> = {}) => {
    const supabase = await createClient()
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants(
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
        product_categories(
          categories(
            id,
            name,
            slug
          )
        )
      `)
      .eq('status', 'active')
    
    // Apply filters
    if (filters.featured) {
      query = query.eq('featured', true)
    }
    
    if (filters.categoryIds?.length > 0) {
      query = query.in('product_categories.category_id', filters.categoryIds)
    }
    
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }
    
    // Apply sorting
    switch (filters.sortBy) {
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
    if (filters.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Cached products fetch error:', error)
      throw new Error('Failed to fetch products')
    }
    
    return data || []
  },
  [cacheKeys.products()],
  {
    revalidate: CACHE_CONFIG.products.revalidate,
    tags: CACHE_CONFIG.products.tags
  }
)

/**
 * Cached individual product fetching
 */
export const getCachedProduct = unstable_cache(
  async (productId: string) => {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(
          id,
          name,
          price,
          sku,
          barcode,
          quantity,
          weight,
          option1,
          option2,
          option3,
          position,
          created_at,
          updated_at
        ),
        product_images(
          id,
          url,
          alt_text,
          position,
          variant_id,
          created_at
        ),
        product_categories(
          categories(
            id,
            name,
            slug,
            description,
            parent_id
          )
        ),
        product_collections(
          collections(
            id,
            name,
            slug,
            description,
            status
          )
        ),
        reviews(
          id,
          rating,
          title,
          comment,
          is_verified_purchase,
          is_published,
          created_at,
          user_id
        )
      `)
      .eq('id', productId)
      .eq('status', 'active')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Product not found
      }
      console.error('Cached product fetch error:', error)
      throw new Error('Failed to fetch product')
    }
    
    return data
  },
  [cacheKeys.product],
  {
    revalidate: CACHE_CONFIG.products.revalidate,
    tags: CACHE_CONFIG.products.tags
  }
)

/**
 * Cached categories fetching
 */
export const getCachedCategories = unstable_cache(
  async (params: { includeEmpty?: boolean; parentId?: string; flat?: boolean } = {}) => {
    const supabase = await createClient()
    
    let query = supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        parent_id,
        position,
        created_at,
        updated_at,
        product_categories(count)
      `)
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    
    if (params.parentId) {
      query = query.eq('parent_id', params.parentId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Cached categories fetch error:', error)
      throw new Error('Failed to fetch categories')
    }
    
    return data || []
  },
  [cacheKeys.categories()],
  {
    revalidate: CACHE_CONFIG.categories.revalidate,
    tags: CACHE_CONFIG.categories.tags
  }
)

/**
 * Cached search results
 */
export const getCachedSearchResults = unstable_cache(
  async (searchQuery: string, filters: Record<string, unknown> = {}) => {
    const supabase = await createClient()
    
    // Use the search_products function for optimized search
    const { data, error } = await supabase.rpc('search_products', {
      search_query: searchQuery,
      category_ids: filters.categoryIds || null,
      collection_ids: filters.collectionIds || null,
      min_price: filters.minPrice || null,
      max_price: filters.maxPrice || null,
      in_stock_only: filters.inStock || false,
      on_sale_only: filters.onSale || false,
      featured_only: filters.featured || false,
      min_rating: filters.minRating || null,
      sort_by: filters.sortBy || 'relevance',
      page_limit: filters.limit || 20,
      page_offset: filters.offset || 0
    })
    
    if (error) {
      console.error('Cached search error:', error)
      throw new Error('Search operation failed')
    }
    
    return data || []
  },
  [cacheKeys.search],
  {
    revalidate: CACHE_CONFIG.search.revalidate,
    tags: CACHE_CONFIG.search.tags
  }
)

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  /**
   * Invalidate all product-related caches
   */
  products: async () => {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('products')
  },
  
  /**
   * Invalidate specific product cache
   */
  product: async () => {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('products')
    // Also invalidate search results that might contain this product
    revalidateTag('search')
  },
  
  /**
   * Invalidate category caches
   */
  categories: async () => {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('categories')
  },
  
  /**
   * Invalidate search caches
   */
  search: async () => {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('search')
  },
  
  /**
   * Invalidate all caches
   */
  all: async () => {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('products')
    revalidateTag('categories')
    revalidateTag('search')
  }
}

/**
 * Cache warming utilities for better performance
 */
export const cacheWarming = {
  /**
   * Warm up product caches with common queries
   */
  products: async () => {
    try {
      // Warm up featured products
      await getCachedProducts({ featured: true, limit: 20 })
      
      // Warm up recent products
      await getCachedProducts({ sortBy: 'created_desc', limit: 20 })
      
      // Warm up popular price ranges
      await getCachedProducts({ maxPrice: 50, limit: 20 })
      await getCachedProducts({ minPrice: 50, maxPrice: 100, limit: 20 })
      
      console.log('Product caches warmed up successfully')
    } catch (error) {
      console.error('Failed to warm up product caches:', error)
    }
  },
  
  /**
   * Warm up category caches
   */
  categories: async () => {
    try {
      // Warm up root categories
      await getCachedCategories({ flat: true })
      
      // Warm up hierarchical categories
      await getCachedCategories()
      
      console.log('Category caches warmed up successfully')
    } catch (error) {
      console.error('Failed to warm up category caches:', error)
    }
  }
}

/**
 * Cache statistics for monitoring
 */
export const getCacheStats = () => {
  return {
    config: CACHE_CONFIG,
    keys: {
      products: 'Dynamic based on filters',
      categories: 'Dynamic based on parameters',
      search: 'Dynamic based on query and filters'
    },
    invalidation: 'Tag-based invalidation available',
    warming: 'Automated cache warming for common queries'
  }
} 