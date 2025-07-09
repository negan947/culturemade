// Zod Validation Schemas for CultureMade E-Commerce Operations
// Provides type-safe validation for all business operations

import { z } from 'zod'

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/** Common ID validation */
export const uuidSchema = z.string().uuid('Invalid ID format')

/** Slug validation for URLs */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')

/** Price validation */
export const priceSchema = z
  .number()
  .min(0, 'Price must be positive')
  .max(999999.99, 'Price too high')

/** Quantity validation */
export const quantitySchema = z
  .number()
  .int('Quantity must be whole number')
  .min(0, 'Quantity cannot be negative')
  .max(10000, 'Quantity too high')

/** Email validation */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email too long')

/** Phone validation */
export const phoneSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .optional()

/** URL validation */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')

// =============================================================================
// PRODUCT VALIDATION SCHEMAS
// =============================================================================

/** Product creation/update validation */
export const productCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name too long'),
  
  slug: slugSchema,
  
  description: z
    .string()
    .max(5000, 'Description too long')
    .optional(),
  
  price: priceSchema,
  
  compareAtPrice: priceSchema.optional(),
  
  cost: priceSchema.optional(),
  
  sku: z
    .string()
    .max(100, 'SKU too long')
    .optional(),
  
  barcode: z
    .string()
    .max(100, 'Barcode too long')
    .optional(),
  
  trackQuantity: z.boolean().default(true),
  
  quantity: quantitySchema.default(0),
  
  allowBackorder: z.boolean().default(false),
  
  weight: z
    .number()
    .min(0, 'Weight must be positive')
    .max(10000, 'Weight too high')
    .optional(),
  
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  
  featured: z.boolean().default(false),
  
  // Category assignments
  categoryIds: z.array(uuidSchema).optional(),
  
  // Collection assignments
  collectionIds: z.array(uuidSchema).optional()
})

export const productUpdateSchema = productCreateSchema.partial()

/** Product variant validation */
export const productVariantCreateSchema = z.object({
  productId: uuidSchema,
  
  name: z
    .string()
    .min(1, 'Variant name is required')
    .max(255, 'Variant name too long'),
  
  price: priceSchema.optional(),
  
  sku: z
    .string()
    .max(100, 'SKU too long')
    .optional(),
  
  barcode: z
    .string()
    .max(100, 'Barcode too long')
    .optional(),
  
  quantity: quantitySchema.default(0),
  
  weight: z
    .number()
    .min(0, 'Weight must be positive')
    .max(10000, 'Weight too high')
    .optional(),
  
  option1: z
    .string()
    .max(100, 'Option 1 too long')
    .optional(),
  
  option2: z
    .string()
    .max(100, 'Option 2 too long')
    .optional(),
  
  option3: z
    .string()
    .max(100, 'Option 3 too long')
    .optional(),
  
  position: z
    .number()
    .int('Position must be whole number')
    .min(0)
    .default(0)
})

export const productVariantUpdateSchema = productVariantCreateSchema.partial()

/** Product image validation */
export const productImageCreateSchema = z.object({
  productId: uuidSchema.optional(),
  variantId: uuidSchema.optional(),
  url: urlSchema,
  altText: z
    .string()
    .max(255, 'Alt text too long')
    .optional(),
  position: z
    .number()
    .int('Position must be whole number')
    .min(0)
    .default(0)
}).refine(
  data => data.productId || data.variantId,
  'Either productId or variantId must be provided'
)

// =============================================================================
// CATEGORY & COLLECTION VALIDATION SCHEMAS
// =============================================================================

/** Category validation */
export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name too long'),
  
  slug: slugSchema,
  
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),
  
  parentId: uuidSchema.optional(),
  
  position: z
    .number()
    .int('Position must be whole number')
    .min(0)
    .default(0)
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

/** Collection validation */
export const collectionCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name too long'),
  
  slug: slugSchema,
  
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),
  
  imageUrl: urlSchema.optional(),
  
  status: z.enum(['active', 'draft']).default('draft'),
  
  position: z
    .number()
    .int('Position must be whole number')
    .min(0)
    .default(0)
})

export const collectionUpdateSchema = collectionCreateSchema.partial()

// =============================================================================
// CART VALIDATION SCHEMAS
// =============================================================================

/** Add to cart validation */
export const addToCartSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional(),
  quantity: z
    .number()
    .int('Quantity must be whole number')
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Quantity too high')
})

/** Update cart item validation */
export const updateCartItemSchema = z.object({
  cartItemId: uuidSchema,
  quantity: z
    .number()
    .int('Quantity must be whole number')
    .min(0, 'Quantity cannot be negative')
    .max(99, 'Quantity too high')
})

/** Remove from cart validation */
export const removeFromCartSchema = z.object({
  cartItemId: uuidSchema
})

// =============================================================================
// ADDRESS VALIDATION SCHEMAS
// =============================================================================

/** Address validation */
export const addressCreateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  
  company: z
    .string()
    .max(100, 'Company name too long')
    .optional(),
  
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(100, 'Address too long'),
  
  addressLine2: z
    .string()
    .max(100, 'Address too long')
    .optional(),
  
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City name too long'),
  
  stateProvince: z
    .string()
    .min(1, 'State/Province is required')
    .max(50, 'State/Province too long'),
  
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code too long'),
  
  countryCode: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .toUpperCase(),
  
  phone: phoneSchema,
  
  type: z.enum(['billing', 'shipping', 'both']).default('both'),
  
  isDefault: z.boolean().default(false)
})

export const addressUpdateSchema = addressCreateSchema.partial()

// =============================================================================
// ORDER VALIDATION SCHEMAS
// =============================================================================

/** Order creation validation */
export const orderCreateSchema = z.object({
  email: emailSchema,
  
  phone: phoneSchema,
  
  billingAddressId: uuidSchema,
  
  shippingAddressId: uuidSchema,
  
  shippingMethodId: uuidSchema.optional(),
  
  notes: z
    .string()
    .max(1000, 'Notes too long')
    .optional(),
  
  // Cart items to include in order
  items: z.array(z.object({
    productId: uuidSchema,
    variantId: uuidSchema.optional(),
    quantity: z.number().int().min(1).max(99),
    price: priceSchema
  })).min(1, 'Order must have at least one item'),
  
  // Discount code
  discountCode: z
    .string()
    .max(50, 'Discount code too long')
    .optional()
})

/** Order status update validation */
export const orderStatusUpdateSchema = z.object({
  orderId: uuidSchema,
  status: z.enum([
    'pending',
    'processing', 
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  ]),
  notes: z
    .string()
    .max(500, 'Notes too long')
    .optional()
})

// =============================================================================
// REVIEW VALIDATION SCHEMAS
// =============================================================================

/** Product review validation */
export const reviewCreateSchema = z.object({
  productId: uuidSchema,
  
  orderId: uuidSchema.optional(),
  
  rating: z
    .number()
    .int('Rating must be whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  
  title: z
    .string()
    .max(100, 'Review title too long')
    .optional(),
  
  comment: z
    .string()
    .max(2000, 'Review comment too long')
    .optional()
})

export const reviewUpdateSchema = reviewCreateSchema.partial()

// =============================================================================
// SEARCH VALIDATION SCHEMAS
// =============================================================================

/** Product search and filtering validation */
export const productSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query too long')
    .optional(),
  
  categoryIds: z
    .array(uuidSchema)
    .max(10, 'Too many categories selected')
    .optional(),
  
  collectionIds: z
    .array(uuidSchema)
    .max(10, 'Too many collections selected')
    .optional(),
  
  minPrice: z
    .number()
    .min(0, 'Minimum price must be positive')
    .optional(),
  
  maxPrice: z
    .number()
    .min(0, 'Maximum price must be positive')
    .optional(),
  
  inStock: z.boolean().optional(),
  
  onSale: z.boolean().optional(),
  
  featured: z.boolean().optional(),
  
  minRating: z
    .number()
    .min(1, 'Minimum rating must be at least 1')
    .max(5, 'Minimum rating cannot exceed 5')
    .optional(),
  
  sortBy: z.enum([
    'created_desc',
    'created_asc',
    'price_asc',
    'price_desc',
    'name_asc',
    'name_desc',
    'rating_desc',
    'featured'
  ]).default('created_desc'),
  
  page: z
    .number()
    .int('Page must be whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z
    .number()
    .int('Limit must be whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
}).refine(
  data => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
  'Minimum price must be less than or equal to maximum price'
)

// =============================================================================
// USER VALIDATION SCHEMAS
// =============================================================================

/** User profile update validation */
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name too long')
    .optional(),
  
  phone: phoneSchema,
  
  avatarUrl: urlSchema.optional()
})

// =============================================================================
// PAYMENT VALIDATION SCHEMAS
// =============================================================================

/** Payment intent creation validation */
export const paymentIntentCreateSchema = z.object({
  orderId: uuidSchema,
  
  amount: z
    .number()
    .int('Amount must be in cents')
    .min(50, 'Amount too small') // $0.50 minimum
    .max(99999999, 'Amount too large'), // $999,999.99 maximum
  
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .default('USD'),
  
  paymentMethodType: z.enum(['card', 'apple_pay']).default('card'),
  
  savePaymentMethod: z.boolean().default(false)
})

// =============================================================================
// ADMIN VALIDATION SCHEMAS
// =============================================================================

/** Admin log creation validation */
export const adminLogCreateSchema = z.object({
  action: z
    .string()
    .min(1, 'Action is required')
    .max(100, 'Action too long'),
  
  resourceType: z
    .string()
    .max(50, 'Resource type too long')
    .optional(),
  
  resourceId: uuidSchema.optional(),
  
  details: z.record(z.any()).optional(),
  
  ipAddress: z
    .string()
    .ip('Invalid IP address')
    .optional(),
  
  userAgent: z
    .string()
    .max(500, 'User agent too long')
    .optional()
})

// =============================================================================
// ANALYTICS VALIDATION SCHEMAS
// =============================================================================

/** Analytics event validation */
export const analyticsEventCreateSchema = z.object({
  eventName: z
    .string()
    .min(1, 'Event name is required')
    .max(100, 'Event name too long'),
  
  sessionId: z
    .string()
    .min(1, 'Session ID is required')
    .max(100, 'Session ID too long'),
  
  properties: z.record(z.any()).optional()
})

// =============================================================================
// CONTACT FORM VALIDATION SCHEMAS
// =============================================================================

/** Contact form validation */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  
  email: emailSchema,
  
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message too long'),
  
  orderId: uuidSchema.optional()
})

// =============================================================================
// IMAGE UPLOAD VALIDATION SCHEMAS
// =============================================================================

/** Image upload validation */
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  
  altText: z
    .string()
    .max(255, 'Alt text too long')
    .optional(),
  
  category: z.enum(['product', 'variant', 'category', 'collection']),
  
  resourceId: uuidSchema.optional()
}).refine(
  data => data.file.type.startsWith('image/'),
  'File must be an image'
).refine(
  data => data.file.size <= 5 * 1024 * 1024, // 5MB
  'File size must be less than 5MB'
)

// =============================================================================
// EXPORT ALL SCHEMAS
// =============================================================================

export const schemas = {
  // Base
  uuid: uuidSchema,
  slug: slugSchema,
  price: priceSchema,
  quantity: quantitySchema,
  email: emailSchema,
  phone: phoneSchema,
  url: urlSchema,
  
  // Products
  productCreate: productCreateSchema,
  productUpdate: productUpdateSchema,
  productVariantCreate: productVariantCreateSchema,
  productVariantUpdate: productVariantUpdateSchema,
  productImageCreate: productImageCreateSchema,
  
  // Categories & Collections
  categoryCreate: categoryCreateSchema,
  categoryUpdate: categoryUpdateSchema,
  collectionCreate: collectionCreateSchema,
  collectionUpdate: collectionUpdateSchema,
  
  // Cart
  addToCart: addToCartSchema,
  updateCartItem: updateCartItemSchema,
  removeFromCart: removeFromCartSchema,
  
  // Address
  addressCreate: addressCreateSchema,
  addressUpdate: addressUpdateSchema,
  
  // Orders
  orderCreate: orderCreateSchema,
  orderStatusUpdate: orderStatusUpdateSchema,
  
  // Reviews
  reviewCreate: reviewCreateSchema,
  reviewUpdate: reviewUpdateSchema,
  
  // Search
  productSearch: productSearchSchema,
  
  // User
  profileUpdate: profileUpdateSchema,
  
  // Payments
  paymentIntentCreate: paymentIntentCreateSchema,
  
  // Admin
  adminLogCreate: adminLogCreateSchema,
  
  // Analytics
  analyticsEventCreate: analyticsEventCreateSchema,
  
  // Contact
  contactForm: contactFormSchema,
  
  // Images
  imageUpload: imageUploadSchema
}

// =============================================================================
// TYPE INFERENCE HELPERS
// =============================================================================

// Infer types from schemas for type safety
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductVariantCreateInput = z.infer<typeof productVariantCreateSchema>
export type ProductVariantUpdateInput = z.infer<typeof productVariantUpdateSchema>
export type ProductImageCreateInput = z.infer<typeof productImageCreateSchema>

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>

export type AddressCreateInput = z.infer<typeof addressCreateSchema>
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>

export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>

export type ProductSearchInput = z.infer<typeof productSearchSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PaymentIntentCreateInput = z.infer<typeof paymentIntentCreateSchema>

export type AdminLogCreateInput = z.infer<typeof adminLogCreateSchema>
export type AnalyticsEventCreateInput = z.infer<typeof analyticsEventCreateSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema> 