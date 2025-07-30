/**
 * Example Integration: ProductDetailModal with ProductGrid
 * 
 * This file demonstrates how to integrate the ProductDetailModal
 * with existing ProductGrid and ProductCard components.
 * This is a reference implementation for the Backend Agent.
 */

'use client';

import { useState } from 'react';

import { ProductListItem } from '@/types/api';

import ProductDetailModal from './ProductDetailModal';
import ProductGrid from './ProductGrid';

interface ProductDetailModalExampleProps {
  products: ProductListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ProductDetailModalExample = ({
  products,
  loading = false,
  error = null,
  onRetry
}: ProductDetailModalExampleProps) => {
  // Modal state management
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle product card click to open modal
  const handleProductClick = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Optionally delay clearing selected product for smoother animation
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Handle add to cart (placeholder for Backend Agent implementation)
  const handleAddToCart = (productId: string, variantId?: string, quantity?: number) => {
    console.log('Add to cart:', { productId, variantId, quantity });
    // TODO: Backend Agent will implement actual cart functionality
    // This would typically:
    // 1. Validate product/variant availability
    // 2. Add item to cart via API
    // 3. Update cart state in Redux
    // 4. Show success/error feedback
    // 5. Optionally close modal or show "Added to Cart" state
  };

  return (
    <>
      {/* Product Grid with click handling */}
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onProductClick={handleProductClick}
        onRetry={onRetry}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};

export default ProductDetailModalExample;