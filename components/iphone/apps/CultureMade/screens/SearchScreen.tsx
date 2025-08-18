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

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Search Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">Search</h1>
          {hasSearched && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-gray-300 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder="Search products..."
          onSearch={handleSearch}
          onSuggestionSelect={handleSuggestionSelect}
          autoFocus={false}
          showSuggestions={true}
          maxSuggestions={6}
          className="mb-3"
        />

        {/* Filter Button */}
        {hasSearched && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters 
                    ? 'bg-blue-800 text-blue-300' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {Object.keys(filters).length > 2 && ( // More than just sort and direction
                <span className="text-xs text-gray-400">
                  {Object.keys(filters).length - 2} applied
                </span>
              )}
            </div>

            {searchInfo && (
              <span className="text-xs text-gray-400">
                {searchInfo.search_time_ms}ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setShowFilters(false)}
            categories={categories}
            className="border-b border-gray-700"
          />
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {!hasSearched ? (
          /* Search Home - Show trending searches and suggestions */
          <div className="h-full overflow-y-auto culturemade-scrollable">
            <div className="p-4 space-y-6">
              {/* Trending Searches */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Flame className="w-5 h-5 text-orange-500 mr-2" />
                  Trending Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((searchTerm, index) => (
                    <motion.button
                      key={searchTerm}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => handleSearch(searchTerm)}
                      className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-700 active:scale-95 transition-all duration-200"
                    >
                      {searchTerm}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  Recent Searches
                </h3>
                <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-600">
                  {/* Placeholder for recent searches - will be implemented with localStorage */}
                  <div className="p-4 text-center text-gray-400">
                    <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">Your recent searches will appear here</p>
                  </div>
                </div>
              </div>

              {/* Search Tips */}
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">Search Tips</h4>
                <ul className="text-sm text-blue-400 space-y-1">
                  <li>• Try specific product names or categories</li>
                  <li>• Use filters to narrow down results</li>
                  <li>• Search by color, style, or brand</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <SearchResults
            query={query}
            onRetry={retry}
            onProductClick={handleProductClick}
            className="h-full"
          />
        )}
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
