// E-Commerce Business Logic Types for CultureMade iPhone App
// Extends database types with business domain models and computed properties

import type { 
  Product as DBProduct, 
  ProductVariant as DBProductVariant, 
  ProductImage as DBProductImage,
  Category as DBCategory,
  Collection as DBCollection,
  CartItem as DBCartItem,
  Order as DBOrder,
  OrderItem as DBOrderItem,
  Address as DBAddress,
  Payment as DBPayment,
  Review as DBReview,
  ProductStatus,
  OrderStatus,
  PaymentStatus
} from './database'

// =============================================================================
// PRODUCT DOMAIN MODELS
// =============================================================================

/** Enhanced Product interface with computed properties and business logic */
export interface Product extends DBProduct {
  // Computed properties
  readonly isOnSale: boolean
  readonly discountPercentage: number | null
  readonly isInStock: boolean
  readonly averageRating: number | null
  readonly reviewCount: number
  readonly isNew: boolean // Created within last 30 days
  readonly isFeatured: boolean
  
  // Related data (populated via joins)
  variants?: ProductVariant[]
  images?: ProductImage[]
  categories?: Category[]
  collections?: Collection[]
  reviews?: Review[]
  
  // Business computed fields
  readonly displayPrice: number // Lowest variant price or base price
  readonly priceRange: { min: number; max: number } | null
  readonly mainImage: ProductImage | null
  readonly stockStatus: StockStatus
}

/** Enhanced Product Variant with business logic */
export interface ProductVariant extends DBProductVariant {
  // Computed properties
  readonly isOnSale: boolean
  readonly discountPercentage: number | null
  readonly isInStock: boolean
  readonly displayName: string // Combines product name with variant options
  
  // Related data
  product?: Product
  images?: ProductImage[]
  
  // Business computed fields
  readonly effectivePrice: number // price || product.price
  readonly stockStatus: StockStatus
  readonly optionsText: string // "Size: L, Color: Blue"
}

/** Enhanced Product Image with display properties */
export interface ProductImage extends DBProductImage {
  // Computed properties
  readonly displayUrl: string // Optimized URL with transforms
  readonly thumbnailUrl: string
  readonly isMain: boolean
  
  // Related data
  product?: Product
  variant?: ProductVariant
}

/** Enhanced Category with hierarchy and computed properties */
export interface Category extends DBCategory {
  // Computed properties
  readonly isRoot: boolean
  readonly hasChildren: boolean
  readonly fullPath: string // "Men / Shirts / Casual"
  readonly depth: number
  
  // Related data
  parent?: Category
  children?: Category[]
  products?: Product[]
  
  // Business computed fields
  readonly productCount: number
  readonly isActive: boolean
}

/** Enhanced Collection with business logic */
export interface Collection extends DBCollection {
  // Related data
  products?: Product[]
  
  // Business computed fields
  readonly productCount: number
  readonly isActive: boolean
}

// =============================================================================
// CART & CHECKOUT DOMAIN MODELS
// =============================================================================

/** Enhanced Cart Item with computed properties */
export interface CartItem extends DBCartItem {
  // Related data (always populated for cart operations)
  product: Product
  variant?: ProductVariant
  
  // Computed properties
  readonly displayName: string
  readonly unitPrice: number
  readonly totalPrice: number
  readonly isAvailable: boolean
  readonly stockStatus: StockStatus
  readonly imageUrl: string | null
  readonly variantOptions: string | null // "Size: L, Color: Blue"
}

/** Cart totals and calculations */
export interface CartTotals {
  readonly subtotal: number
  readonly taxAmount: number
  readonly shippingAmount: number
  readonly discountAmount: number
  readonly totalAmount: number
  readonly itemCount: number
  readonly currency: string
}

/** Complete cart state with items and calculations */
export interface Cart {
  readonly items: CartItem[]
  readonly totals: CartTotals
  readonly isLoading: boolean
  readonly lastUpdated: string | null
  readonly sessionId: string | null
  readonly userId: string | null
}

// =============================================================================
// ORDER DOMAIN MODELS
// =============================================================================

/** Enhanced Order with computed properties and full data */
export interface Order extends DBOrder {
  // Related data
  items: OrderItem[]
  billingAddress?: Address
  shippingAddress?: Address
  payments?: Payment[]
  
  // Computed properties
  readonly displayOrderNumber: string
  readonly statusDisplay: string
  readonly isEditable: boolean
  readonly canCancel: boolean
  readonly canReturn: boolean
  readonly estimatedDelivery: string | null
  readonly trackingInfo: TrackingInfo | null
}

/** Enhanced Order Item with product details */
export interface OrderItem extends DBOrderItem {
  // Related data
  product?: Product // May be null if product was deleted
  variant?: ProductVariant
  
  // Computed properties
  readonly displayName: string
  readonly imageUrl: string | null
  readonly variantOptions: string | null
}

/** Order tracking information */
export interface TrackingInfo {
  trackingNumber: string
  carrier: string
  status: string
  estimatedDelivery: string | null
  trackingUrl: string | null
  updates: TrackingUpdate[]
}

export interface TrackingUpdate {
  timestamp: string
  status: string
  location: string | null
  description: string
}

// =============================================================================
// USER & ADDRESS DOMAIN MODELS
// =============================================================================

/** Enhanced Address with validation and display */
export interface Address extends DBAddress {
  // Computed properties
  readonly displayName: string // "John Doe - Home"
  readonly fullAddress: string // Complete formatted address
  readonly isComplete: boolean
  readonly countryName: string
}

// =============================================================================
// REVIEW DOMAIN MODELS
// =============================================================================

/** Enhanced Review with author and product info */
export interface Review extends DBReview {
  // Related data
  product?: Product
  author?: { id: string; name: string; avatar?: string }
  
  // Computed properties
  readonly displayAuthor: string
  readonly timeAgo: string
  readonly isHelpful: boolean
  readonly helpfulCount: number
}

// =============================================================================
// SEARCH & FILTERING
// =============================================================================

/** Product search and filtering options */
export interface ProductFilters {
  query?: string
  categoryIds?: string[]
  collectionIds?: string[]
  priceRange?: { min: number; max: number }
  inStock?: boolean
  onSale?: boolean
  featured?: boolean
  rating?: number // Minimum rating
  sortBy?: ProductSortOption
  limit?: number
  offset?: number
}

export type ProductSortOption = 
  | 'created_desc'  // Newest first
  | 'created_asc'   // Oldest first
  | 'price_asc'     // Price low to high
  | 'price_desc'    // Price high to low
  | 'name_asc'      // A-Z
  | 'name_desc'     // Z-A
  | 'rating_desc'   // Best rated
  | 'featured'      // Featured first

/** Search results with metadata */
export interface ProductSearchResult {
  products: Product[]
  totalCount: number
  hasMore: boolean
  filters: ProductFilters
  facets: SearchFacets
}

/** Search facets for filtering */
export interface SearchFacets {
  categories: { id: string; name: string; count: number }[]
  collections: { id: string; name: string; count: number }[]
  priceRanges: { min: number; max: number; count: number }[]
  ratings: { rating: number; count: number }[]
}

// =============================================================================
// BUSINESS ENUMS & CONSTANTS
// =============================================================================

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  BACKORDER = 'backorder'
}

export enum CheckoutStep {
  CART = 'cart',
  SHIPPING = 'shipping',
  PAYMENT = 'payment',
  REVIEW = 'review',
  SUCCESS = 'success'
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

/** API error response */
export interface ApiError {
  code: string
  message: string
  field?: string
  details?: any
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

/** Address form input */
export interface AddressFormData {
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince: string
  postalCode: string
  countryCode: string
  phone?: string
  type?: 'billing' | 'shipping' | 'both'
  isDefault?: boolean
}

/** Product review form input */
export interface ReviewFormData {
  rating: number
  title?: string
  comment?: string
  productId: string
  orderId?: string
}

/** Contact form for customer support */
export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  orderId?: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Loading state for async operations */
export interface LoadingState {
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

/** Pagination info */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
  hasPrevious: boolean
}

/** Image upload and processing */
export interface ImageUpload {
  file: File
  preview: string
  uploadProgress: number
  error: string | null
}

export interface OptimizedImage {
  original: string
  thumbnail: string
  medium: string
  large: string
  webp?: string
  avif?: string
}

// =============================================================================
// ANALYTICS & TRACKING
// =============================================================================

/** E-commerce event tracking */
export interface EcommerceEvent {
  event: string
  userId?: string
  sessionId: string
  timestamp: string
  properties: Record<string, any>
}

/** Product view event */
export interface ProductViewEvent extends EcommerceEvent {
  event: 'product_view'
  properties: {
    productId: string
    productName: string
    categoryId?: string
    price: number
    variant?: string
  }
}

/** Add to cart event */
export interface AddToCartEvent extends EcommerceEvent {
  event: 'add_to_cart'
  properties: {
    productId: string
    variantId?: string
    quantity: number
    price: number
    totalValue: number
  }
}

/** Purchase event */
export interface PurchaseEvent extends EcommerceEvent {
  event: 'purchase'
  properties: {
    orderId: string
    totalValue: number
    currency: string
    items: {
      productId: string
      variantId?: string
      quantity: number
      price: number
    }[]
  }
} 