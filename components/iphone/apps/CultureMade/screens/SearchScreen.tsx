'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Clock,
  Flame,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { ProductListItem } from '@/types/api';
import { getCartSessionId } from '@/utils/cartSync';

import ProductDetailModal from '../components/ProductDetailModal';
import SearchBar from '../components/SearchBar';
import SearchFilters, { SearchFilters as ISearchFilters } from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';
import { SearchSuggestion } from '../hooks/useSearchSuggestions';


export default function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [categories] = useState([
    { id: '1', name: 'Shirts', slug: 'shirts', product_count: 25 },
    { id: '2', name: 'Pants', slug: 'pants', product_count: 18 },
    { id: '3', name: 'Shoes', slug: 'shoes', product_count: 12 },
    { id: '4', name: 'Accessories', slug: 'accessories', product_count: 8 },
  ]);

  const {
    query,
    filters,
    results,
    pagination,
    searchInfo,
    loading,
    error,
    hasSearched,
    search,
    loadMore,
    updateFilters,
    clearSearch,
    retry,
    setQuery,
  } = useSearch({
    autoSearch: false,
    cacheResults: true,
    trackAnalytics: true,
  });

  const trendingSearches = [
    'vintage denim',
    'minimalist style',
    'sustainable fashion',
    'streetwear',
    'accessories'
  ];

  const handleSearch = (searchQuery: string) => {
    search(searchQuery);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    console.log('Selected suggestion:', suggestion);
    search(suggestion.text);
  };

  const handleFiltersChange = (newFilters: ISearchFilters) => {
    updateFilters(newFilters);
  };

  const handleClearAll = () => {
    clearSearch();
    setShowFilters(false);
  };

  const handleProductClick = (productId: string) => {
    // Find the product in the results
    const product = results.find(p => p.id === productId);
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
    <>
      <div className="h-full bg-gray-50 relative">
      {/* Search Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              placeholder="Search products..."
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              showSuggestions={!hasSearched}
              maxSuggestions={6}
              autoFocus={false}
            />
          </div>
          
          {hasSearched && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleClearAll}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {hasSearched ? (
            /* Search Results */
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <SearchResults
                query={query}
                onRetry={retry}
                onProductClick={handleProductClick}
              />
            </motion.div>
          ) : (
            /* Default State - Browse & Discover */
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto px-4 py-6"
            >
              {/* Trending Searches */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Flame className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
                </div>
                <div className="space-y-2">
                  {trendingSearches.map((search, index) => (
                    <motion.button
                      key={search}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => handleSearch(search)}
                      className="flex items-center w-full px-4 py-3 bg-white rounded-lg border border-gray-200 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Flame className="h-4 w-4 text-orange-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{search}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <SearchIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Browse Categories</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      onClick={() => search('', { category: category.id })}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {category.product_count} items
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'New Arrivals', filters: { sort: 'created_at' as const } },
                    { label: 'On Sale', filters: { onSale: true } },
                    { label: 'Under $50', filters: { maxPrice: 50 } },
                    { label: 'Featured', filters: { featured: true } },
                    { label: 'In Stock', filters: { inStock: true } },
                  ].map((item, index) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                      onClick={() => search('', item.filters)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 active:bg-blue-300 transition-colors"
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Modal */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="absolute inset-0 bg-black bg-opacity-25 z-30"
              />
              
              {/* Filters Panel */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-40"
              >
                <SearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClose={() => setShowFilters(false)}
                  categories={categories}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}