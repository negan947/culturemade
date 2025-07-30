/**
 * Centralized API Type Definitions
 * 
 * This file contains all TypeScript types for API requests and responses
 * across the CultureMade application. These types ensure type safety
 * and consistency between frontend and backend components.
 */

import { z } from 'zod';

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: PaginationInfo;
}

// =============================================================================
// PRODUCT RELATED TYPES
// =============================================================================

// Base product types
export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: string | null;
  quantity: number;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  position: number;
}

// Product list item for grid/catalog views
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  created_at: string;
  variant_count: number;
  min_price: string;
  max_price: string;
  total_inventory: number;
  primary_image: ProductImage | null;
  categories: ProductCategory[];
}

// Complete product detail for individual product views
export interface ProductDetail {
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
  seo_title: string | null;
  seo_description: string | null;
  variants: ProductVariant[];
  categories: ProductCategory[];
  images: ProductImage[];
  related_products: RelatedProduct[];
  total_inventory: number;
  min_price: string;
  max_price: string;
}

// Related product for recommendations
export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  primary_image: ProductImage | null;
}

// =============================================================================
// PRODUCT API RESPONSES
// =============================================================================

export interface ProductListResponse extends PaginatedResponse<ProductListItem> {}

export interface ProductDetailResponse extends APIResponse<ProductDetail> {}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchSuggestion {
  id: string;
  name: string;
  price: string;
  primary_image: ProductImage | null;
}

export interface SearchResultItem extends ProductListItem {
  relevance_score?: number;
}

export interface SearchInfo {
  query: string;
  suggestions_only: boolean;
  filters_applied: string[];
  search_time_ms: number;
}

export interface SearchResponse extends PaginatedResponse<SearchResultItem> {
  suggestions?: SearchSuggestion[];
  search_info: SearchInfo;
}

// =============================================================================
// CART TYPES
// =============================================================================

export interface CartItem {
  id: string;
  user_id: string | null;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    primary_image: ProductImage | null;
  };
  variant: {
    id: string;
    name: string;
    price: string | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
  };
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  item_count: number;
}

export interface Cart {
  items: CartItem[];
  totals: CartTotals;
}

export interface CartResponse extends APIResponse<Cart> {}

// =============================================================================
// ORDER TYPES
// =============================================================================

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: string;
  total: string;
  product_name: string;
  variant_name: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
  shipping_address?: any;
  billing_address?: any;
}

export interface OrderListResponse extends PaginatedResponse<Order> {}

export interface OrderDetailResponse extends APIResponse<Order> {}

// =============================================================================
// USER/PROFILE TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProfileResponse extends APIResponse<UserProfile> {}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Product list parameters validation
export const productListParamsSchema = z.object({
  page: z.string().nullable().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().nullable().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  category: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'draft', 'archived']).nullable().optional(),
  featured: z.string().nullable().optional().transform((val) => val === 'true'),
  min_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  max_price: z.string().nullable().optional().transform((val) => val ? parseFloat(val) : undefined),
  sort: z.enum(['price', 'name', 'created_at', 'featured']).nullable().optional().default('created_at'),
  direction: z.enum(['asc', 'desc']).nullable().optional().default('desc'),
  search: z.string().nullable().optional(),
});

// Product ID validation
export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

// Search parameters validation
export const searchParamsSchema = z.object({
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

// Cart item validation
export const addToCartSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid('Invalid variant ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(100, 'Quantity too large'),
});

export const updateCartItemSchema = z.object({
  cart_item_id: z.string().uuid('Invalid cart item ID'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater').max(100, 'Quantity too large'),
});

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface APIError extends APIResponse {
  success: false;
  error: string;
  details?: ValidationError[] | any;
  status_code?: number;
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

export interface AdminDashboardStats {
  total_products: number;
  total_orders: number;
  total_customers: number;
  total_revenue: number;
  low_stock_products: number;
  pending_orders: number;
  recent_orders: Order[];
}

export interface AdminDashboardResponse extends APIResponse<AdminDashboardStats> {}

// =============================================================================
// TYPE UTILITIES
// =============================================================================

// Helper type for API parameters
export type ProductListParams = z.infer<typeof productListParamsSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type AddToCartParams = z.infer<typeof addToCartSchema>;
export type UpdateCartItemParams = z.infer<typeof updateCartItemSchema>;

// Helper type for creating API responses
export type CreateAPIResponse<T> = APIResponse<T>;
export type CreatePaginatedResponse<T> = PaginatedResponse<T>;

// Export validation schemas for use in API routes
export const ValidationSchemas = {
  productListParams: productListParamsSchema,
  productId: productIdSchema,
  searchParams: searchParamsSchema,
  addToCart: addToCartSchema,
  updateCartItem: updateCartItemSchema,
} as const;