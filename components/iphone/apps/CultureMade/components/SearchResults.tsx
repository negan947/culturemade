'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon,
  SlidersHorizontal,
  Grid3X3,
  List,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { ProductListItem } from '@/types/api';

import { ProductGrid } from './index';


interface SearchResultsProps {
  query: string;
  onRetry?: () => void;
  onProductClick?: (productId: string) => void;
  className?: string;
}

interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: 'relevance' | 'price' | 'name' | 'created_at';
  direction: 'asc' | 'desc';
  inStock?: boolean;
  onSale?: boolean;
}

interface SearchResponse {
  success: boolean;
  data: ProductListItem[];
  error?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  search_info: {
    query: string;
    filters_applied: string[];
    search_time_ms: number;
  };
}

const DEFAULT_FILTERS: SearchFilters = {
  sort: 'relevance',
  direction: 'desc',
};

export default function SearchResults({ 
  query, 
  onRetry,
  onProductClick, 
  className = "" 
}: SearchResultsProps) {
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [searchInfo, setSearchInfo] = useState<SearchResponse['search_info'] | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Perform search
  const performSearch = async (searchQuery: string, searchFilters: SearchFilters, page = 1) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '20',
        sort: searchFilters.sort,
        direction: searchFilters.direction,
      });
      
      if (searchFilters.category) {
        params.append('category', searchFilters.category);
      }
      if (searchFilters.minPrice !== undefined) {
        params.append('min_price', searchFilters.minPrice.toString());
      }
      if (searchFilters.maxPrice !== undefined) {
        params.append('max_price', searchFilters.maxPrice.toString());
      }
      
      const response = await fetch(`/api/products/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }
      
      // Transform API data to match ProductListItem interface
      const transformedResults: ProductListItem[] = data.data.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        compare_at_price: item.compare_at_price,
        featured: item.featured,
        min_price: item.min_price,
        max_price: item.max_price,
        total_inventory: item.total_inventory,
        primary_image: item.primary_image || null,
        categories: item.categories || [],
        status: 'active' as const,
        created_at: new Date().toISOString(),
        variant_count: 0, // Required field
      }));
      
      setResults(page === 1 ? transformedResults : [...results, ...transformedResults]);
      setPagination(data.pagination);
      setSearchInfo(data.search_info);
      
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Search when query or filters change
  useEffect(() => {
    if (query.trim()) {
      performSearch(query, filters, 1);
    } else {
      setResults([]);
      setPagination(null);
      setSearchInfo(null);
    }
  }, [query, filters]);
  
  // Handle load more
  const handleLoadMore = () => {
    if (pagination && pagination.has_next && !loading) {
      performSearch(query, filters, pagination.page + 1);
    }
  };
  
  // Handle product click
  const handleProductClick = (productId: string) => {
    if (onProductClick) {
      onProductClick(productId);
    } else {

    }
  };
  
  // Handle retry
  const handleRetry = () => {
    onRetry?.();
    if (query.trim()) {
      performSearch(query, filters, 1);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Handle sort change
  const handleSortChange = (sort: SearchFilters['sort'], direction: SearchFilters['direction']) => {
    handleFilterChange({ sort, direction });
  };
  
  if (!query.trim()) {
    return null;
  }
  
  return (
    <div className={`h-full bg-gray-50 ${className}`}>
      {/* Search Results Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
            </h2>
            <p className="text-sm text-gray-500">
              {loading ? (
                'Searching...'
              ) : error ? (
                'Search failed'
              ) : pagination ? (
                `${pagination.total} results for "${query}"`
              ) : (
                `Results for "${query}"`
              )}
              {searchInfo && (
                <span className="ml-2 text-xs text-gray-400">
                  ({searchInfo.search_time_ms}ms)
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Most Relevant', sort: 'relevance' as const, direction: 'desc' as const },
            { label: 'Price: Low to High', sort: 'price' as const, direction: 'asc' as const },
            { label: 'Price: High to Low', sort: 'price' as const, direction: 'desc' as const },
            { label: 'Newest First', sort: 'created_at' as const, direction: 'desc' as const },
            { label: 'A-Z', sort: 'name' as const, direction: 'asc' as const },
          ].map((option) => (
            <button
              key={`${option.sort}-${option.direction}`}
              onClick={() => handleSortChange(option.sort, option.direction)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.sort === option.sort && filters.direction === option.direction
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleFilterChange({ minPrice: parseFloat(value) });
                        } else {
                          const newFilters = { ...filters };
                          delete newFilters.minPrice;
                          handleFilterChange(newFilters);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleFilterChange({ maxPrice: parseFloat(value) });
                        } else {
                          const newFilters = { ...filters };
                          delete newFilters.maxPrice;
                          handleFilterChange(newFilters);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Availability Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock || false}
                        onChange={(e) => handleFilterChange({ inStock: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.onSale || false}
                        onChange={(e) => handleFilterChange({ onSale: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">On Sale Only</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search Results Content */}
      <div className="flex-1 overflow-y-auto culturemade-scrollable">
        <AnimatePresence mode="wait">
          {loading && results.length === 0 ? (
            /* Loading State */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Searching products...</p>
              </div>
            </motion.div>
          ) : error ? (
            /* Error State */
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center h-64"
            >
              <div className="text-center max-w-sm">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Search Failed</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </motion.div>
          ) : results.length === 0 ? (
            /* Empty State */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center h-64"
            >
              <div className="text-center max-w-sm">
                <SearchIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-500 text-sm">
                  We couldn&apos;t find any products matching &quot;{query}&quot;. 
                  Try adjusting your search terms or filters.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Results */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <ProductGrid
                products={results}
                loading={loading}
                error={null}
                onProductClick={handleProductClick}
                onRetry={handleRetry}
              />
              
              {/* Load More */}
              {pagination && pagination.has_next && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      `Load More (${pagination.total - results.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}