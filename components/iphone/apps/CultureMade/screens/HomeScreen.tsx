'use client';

import { motion } from 'framer-motion';
import { Sparkles, Flame, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';

import { ProductListItem } from '@/types/api';
import { getCartSessionId } from '@/utils/cartSync';

import { DragScrollContainer } from '../components';
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
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          variantId: variantId || null, // Let the API handle finding a variant
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

      
      // Dispatch custom event to refresh cart components
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { type: 'add', productId, quantity, result } 
      }));
      
      console.log('✅ Item added to cart successfully');
    } catch (error) {
      console.error('❌ Failed to add item to cart:', error);
      throw error; // Re-throw to let calling component handle the error
    }
  };

  const handleRetry = () => {
    setError(null);
    setProducts([]);
    setOffset(0);
    // Re-fetch products
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          limit: '20',
          offset: '0',
          featured: 'true'
        });
        
        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        setProducts(data.products || []);
        setHasMore(data.pagination?.hasMore || false);
        setOffset(20);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-full bg-gray-50">
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50">
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="font-medium">Failed to load products</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-1">Featured and trending products</p>
      </div>

      {/* Featured Categories */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex space-x-3 overflow-x-auto">
          {[
            { name: 'Trending', icon: Flame, color: 'bg-red-100 text-red-600' },
            { name: 'New', icon: Sparkles, color: 'bg-blue-100 text-blue-600' },
            { name: 'Sale', icon: Tag, color: 'bg-green-100 text-green-600' }
          ].map((category, index) => (
            <motion.button
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full ${category.color} font-medium text-sm`}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <DragScrollContainer className="flex-1 overflow-y-auto culturemade-scrollable">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                />
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Load more products
                  const fetchMoreProducts = async () => {
                    try {
                      const params = new URLSearchParams({
                        limit: '20',
                        offset: offset.toString(),
                        featured: 'true'
                      });
                      
                      const response = await fetch(`/api/products?${params}`);
                      
                      if (!response.ok) {
                        throw new Error('Failed to fetch products');
                      }
                      
                      const data = await response.json();
                      
                      setProducts(prev => [...prev, ...(data.products || [])]);
                      setHasMore(data.pagination?.hasMore || false);
                      setOffset(prev => prev + 20);
                    } catch (err) {
                      console.error('Failed to load more products:', err);
                    }
                  };

                  fetchMoreProducts();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Load More Products
              </motion.button>
            </div>
          )}
        </div>
      </DragScrollContainer>

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
