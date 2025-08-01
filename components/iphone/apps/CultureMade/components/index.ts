/**
 * CultureMade App Components - Export Barrel
 * 
 * Centralized exports for all CultureMade iPhone app components.
 * Provides clean imports throughout the application.
 */

// Product Display Components
export { default as ProductGrid } from './ProductGrid';
export { default as ProductCard } from './ProductCard';
export { default as ProductImage } from './ProductImage';
export { default as ProductCardSkeleton } from './ProductCardSkeleton';

// Product Detail Modal Components
export { default as ProductDetailModal } from './ProductDetailModal';
export { default as ProductImageGallery } from './ProductImageGallery';
export { default as ProductInfoSection } from './ProductInfoSection';

// Search Components
export { default as SearchBar } from './SearchBar';
export { default as SearchResults } from './SearchResults';
export { default as SearchFilters } from './SearchFilters';

// Cart Components
export { CartDrawer } from './CartDrawer';
export { CartIcon, CartIconBadge, CartIconWithDropdown } from './CartIcon';
export { default as CartItem, CartItemSkeleton } from './CartItem';

// Utility Components
export { default as DragScrollContainer } from './DragScrollContainer';

// Component Types
export type { ProductListItem, ProductImage, ProductCategory } from '@/types/api';

// Re-export common product-related types for convenience
export type {
  ProductDetail,
  ProductVariant,
  RelatedProduct
} from '@/types/api';