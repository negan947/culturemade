'use client';

import React, { useEffect, useRef } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function TestHooksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Test infinite scroll hook
  const {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
    refresh,
    pagination,
    observerRef,
  } = useInfiniteScroll({
    pageSize: 20,
    threshold: 0.8,
  });

  // Test error handler hook
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    onError: (error) => {
      console.log('Error handled:', error);
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
  });

  // Test API endpoint directly
  const testApiEndpoint = async () => {
    try {
      const response = await fetch('/api/products?page=1&limit=5');
      const data = await response.json();
      console.log('API Test Results:', {
        success: data.success,
        productCount: data.data?.length || 0,
        pagination: data.pagination,
        firstProduct: data.data?.[0],
      });
    } catch (error) {
      console.error('API Test Failed:', error);
    }
  };

  useEffect(() => {
    // Test the API endpoint when component mounts
    testApiEndpoint();
  }, []);

  const handleTestError = () => {
    errorHandler.handleError(new Error('Test error for error handler'), {
      context: 'Testing error handling',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestRetry = async () => {
    if (errorHandler.error && errorHandler.error.retryable) {
      try {
        await errorHandler.retry();
        console.log('Retry successful');
      } catch (error) {
        console.log('Retry failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Backend Hooks Testing</h1>
        
        {/* API Endpoint Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Endpoint Test</h2>
          <button
            onClick={testApiEndpoint}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test /api/products Endpoint
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Check browser console for API test results
          </p>
        </div>

        {/* Error Handler Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Error Handler Test</h2>
          <div className="space-x-4">
            <button
              onClick={handleTestError}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Trigger Test Error
            </button>
            <button
              onClick={handleTestRetry}
              disabled={!errorHandler.error?.retryable || errorHandler.isRetrying}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Test Retry
            </button>
            <button
              onClick={errorHandler.clearError}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Error
            </button>
          </div>
          
          {errorHandler.hasError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error State:</p>
              <p className="text-red-600">{errorHandler.error?.message}</p>
              <p className="text-sm text-red-500 mt-1">
                Type: {errorHandler.error?.type} | 
                Retryable: {errorHandler.error?.retryable ? 'Yes' : 'No'} | 
                Retry Count: {errorHandler.error?.retryCount}
              </p>
            </div>
          )}
          
          {errorHandler.isRetrying && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">Retrying operation...</p>
            </div>
          )}
        </div>

        {/* Infinite Scroll Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Infinite Scroll Test</h2>
          
          <div className="mb-4 flex gap-4">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={loadMore}
              disabled={loading || !hasMore}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Load More
            </button>
            <button
              onClick={retry}
              disabled={loading || !error}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Retry
            </button>
          </div>

          {/* Status Information */}
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Products:</span> {products.length}
              </div>
              <div>
                <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Has More:</span> {hasMore ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Current Page:</span> {pagination?.page || 'N/A'}
              </div>
            </div>
            {pagination && (
              <div className="mt-2 text-sm text-gray-600">
                Total: {pagination.total} | Pages: {pagination.total_pages}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Products List */}
          <div className="max-h-96 overflow-y-auto" ref={containerRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  
                  {product.primary_image && (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <img
                        src={product.primary_image.url}
                        alt={product.primary_image.alt_text || product.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-600">${product.price}</span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.compare_at_price}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Variants: {product.variant_count} | Stock: {product.total_inventory}
                    </div>
                    
                    {product.featured && (
                      <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Featured
                      </span>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            )}

            {/* Intersection Observer Target */}
            {hasMore && !loading && (
              <div
                ref={observerRef}
                className="h-4 flex justify-center items-center text-gray-500 text-sm py-4"
              >
                Scroll for more products
              </div>
            )}

            {!hasMore && products.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                No more products to load
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}