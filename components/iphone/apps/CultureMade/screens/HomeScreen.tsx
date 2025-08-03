'use client';

import { motion } from 'framer-motion';
import { Sparkles, Flame, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';

import { ProductListItem } from '@/types/api';
import { getCartSessionId } from '@/utils/cartSync';

import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';


export default function HomeScreen() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async (resetProducts = true) => {
      try {
        if (resetProducts) {
          setLoading(true);
          setProducts([]);
          setOffset(0);
        }
        
        const params = new URLSearchParams({
          limit: '20',
          offset: resetProducts ? '0' : offset.toString(),
          featured: 'true' // Show featured products first
        });
        
        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        if (resetProducts) {
          setProducts(data.products || []);
        } else {
          setProducts(prev => [...prev, ...(data.products || [])]);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setOffset(prev => resetProducts ? 20 : prev + 20);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (productId: string) => {
    // Find the product in the results
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setShowProductModal(true);
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = async (productId: string, variantId?: string, quantity = 1) => {
    try {
      // Use the same session ID as the cart screen
      const sessionId = getCartSessionId();
      
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          variantId, // API will find first available variant if null/undefined
          quantity,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cart API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to add item to cart: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Item added to cart:', result);
      
      // Dispatch custom event to refresh cart components
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { type: 'add', productId, quantity, result } 
      }));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      // TODO: Show error message to user
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">CultureMade</h1>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Scrollable Content - Hybrid: Native mobile + Drag desktop */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain scrollable drag-scroll-container"
        onMouseDown={(e) => {
          // Only enable drag scrolling on desktop (non-touch devices)
          if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
          
          const container = e.currentTarget;
          let isScrolling = false;
          let startY = e.pageY;
          let startScrollTop = container.scrollTop;

          const handleMouseMove = (e: MouseEvent) => {
            if (!isScrolling) return;
            e.preventDefault();
            const deltaY = e.pageY - startY;
            container.scrollTop = startScrollTop - deltaY;
          };

          const handleMouseUp = () => {
            isScrolling = false;
            container.style.cursor = '';
            container.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          // Start drag scrolling
          isScrolling = true;
          container.style.cursor = 'grabbing';
          container.style.userSelect = 'none';
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        style={{ cursor: 'grab' }}
      >
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-bold mb-2">Welcome to CultureMade</h2>
            <p className="text-blue-100 text-sm">
              Discover the latest fashion trends and express your unique style
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop by Category</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Sparkles, label: "New Arrivals", color: "bg-pink-100 text-pink-600" },
              { icon: Flame, label: "Trending", color: "bg-orange-100 text-orange-600" },
              { icon: Tag, label: "Sale", color: "bg-red-100 text-red-600" },
              { icon: Sparkles, label: "Featured", color: "bg-purple-100 text-purple-600" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
              >
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{item.label}</h4>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Featured Products</h3>
            <button className="text-blue-600 text-sm font-medium">See All</button>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium">Error Loading Products</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-600 text-xs mt-2 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Real Product Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (index % 20) * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!loading && !error && products.length > 0 && hasMore && (
            <div className="mt-6">
              <button
                onClick={() => {
                  // TODO: Implement load more functionality
                  console.log('Load more products');
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Load More Products
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">No products available</p>
              <p className="text-gray-400 text-xs mt-1">Check back later for new arrivals</p>
            </div>
          )}

          {/* Debug: Add extra content to test scrolling */}
          {!loading && !error && products.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">End of products - scroll test</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">More content here</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800">Even more content</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-800">Final test content</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}