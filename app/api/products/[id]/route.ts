import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/validations/ecommerce'
import type { ApiResponse, Product } from '@/types/ecommerce'

/**
 * GET /api/products/[id] - Get individual product details
 * 
 * Returns complete product information including:
 * - All product variants with pricing and stock
 * - All product images ordered by position
 * - Categories and collections
 * - Reviews and ratings (TODO)
 * - Related products (TODO)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product ID
    const productId = uuidSchema.parse(params.id)
    
    const supabase = await createClient()
    
    // Fetch complete product data with all related information
    const { data: product, error } = await supabase
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
      .eq('status', 'active') // Only return active products
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<ApiResponse>({
          success: false,
          data: null,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        }, { status: 404 })
      }
      
      console.error('Database error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch product'
        }
      }, { status: 500 })
    }
    
    // Calculate reviews data
    const publishedReviews = product.reviews?.filter(review => review.is_published) || []
    const averageRating = publishedReviews.length > 0
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / publishedReviews.length
      : null
    
    // Sort variants by position
    const sortedVariants = product.product_variants?.sort((a, b) => a.position - b.position) || []
    
    // Sort images by position
    const sortedImages = product.product_images?.sort((a, b) => a.position - b.position) || []
    
    // Calculate price range from variants
    const variantPrices = sortedVariants
      .map(variant => variant.price || product.price)
      .filter(price => price !== null)
    
    const priceRange = variantPrices.length > 1
      ? {
          min: Math.min(...variantPrices),
          max: Math.max(...variantPrices)
        }
      : null
    
    // Calculate total stock across all variants
    const totalStock = sortedVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0)
    const productStock = product.track_quantity ? (product.quantity || 0) : 0
    const effectiveStock = sortedVariants.length > 0 ? totalStock : productStock
    
    // Transform product with computed properties
    const transformedProduct: Product = {
      ...product,
      // Computed properties
      isOnSale: !!product.compare_at_price && product.compare_at_price > product.price,
      discountPercentage: product.compare_at_price 
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : null,
      isInStock: effectiveStock > 0 || product.allow_backorder,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      reviewCount: publishedReviews.length,
      isNew: new Date(product.created_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days
      isFeatured: product.featured,
      displayPrice: variantPrices.length > 0 ? Math.min(...variantPrices) : product.price,
      priceRange,
      mainImage: sortedImages.find(img => img.position === 0) || sortedImages[0] || null,
      stockStatus: effectiveStock > 10 
        ? 'in_stock' 
        : effectiveStock > 0 
          ? 'low_stock' 
          : product.allow_backorder 
            ? 'backorder' 
            : 'out_of_stock',
      
      // Related data with transformations
      variants: sortedVariants.map(variant => ({
        ...variant,
        // Computed properties for variants
        isOnSale: !!variant.price && !!product.compare_at_price && variant.price < product.compare_at_price,
        discountPercentage: variant.price && product.compare_at_price && variant.price < product.compare_at_price
          ? Math.round(((product.compare_at_price - variant.price) / product.compare_at_price) * 100)
          : null,
        isInStock: (variant.quantity || 0) > 0 || product.allow_backorder,
        displayName: variant.name || `${product.name} - ${[variant.option1, variant.option2, variant.option3].filter(Boolean).join(', ')}`,
        effectivePrice: variant.price || product.price,
        stockStatus: (variant.quantity || 0) > 10 
          ? 'in_stock' 
          : (variant.quantity || 0) > 0 
            ? 'low_stock' 
            : product.allow_backorder 
              ? 'backorder' 
              : 'out_of_stock',
        optionsText: [variant.option1, variant.option2, variant.option3].filter(Boolean).join(', ') || ''
      })),
      
      images: sortedImages.map(image => ({
        ...image,
        displayUrl: image.url, // TODO: Add image optimization transforms
        thumbnailUrl: image.url, // TODO: Add thumbnail transforms
        isMain: image.position === 0
      })),
      
      categories: product.product_categories?.map(pc => ({
        ...pc.categories,
        isRoot: !pc.categories.parent_id,
        hasChildren: false, // TODO: Calculate if has children
        fullPath: pc.categories.name, // TODO: Build full path
        depth: 0, // TODO: Calculate depth
        productCount: 0, // TODO: Calculate product count
        isActive: true
      })) || [],
      
      collections: product.product_collections?.map(pc => ({
        ...pc.collections,
        productCount: 0, // TODO: Calculate product count
        isActive: pc.collections.status === 'active'
      })) || [],
      
      reviews: publishedReviews.map(review => ({
        ...review,
        displayAuthor: 'Customer', // TODO: Get actual user name (anonymized)
        timeAgo: getTimeAgo(review.created_at),
        isHelpful: false, // TODO: Calculate helpfulness
        helpfulCount: 0 // TODO: Calculate helpful count
      }))
    }
    
    const response: ApiResponse<Product> = {
      success: true,
      data: transformedProduct
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' // Cache for 10 minutes
      }
    })
    
  } catch (error) {
    console.error('Product detail API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json<ApiResponse>({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product ID format'
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

/**
 * Helper function to calculate time ago string
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
} 