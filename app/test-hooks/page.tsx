'use client';

import React, { useRef } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function TestHooksPage() {
  const _containerRef = useRef<HTMLDivElement>(null);
  
  // Test infinite scroll hook
  const {
    products: _products,
    loading: _loading,
    error: _error,
    hasMore: _hasMore,
    loadMore: _loadMore,
    retry: _retry,
    refresh: _refresh,
    pagination: _pagination,
    observerRef: _observerRef,
  } = useInfiniteScroll({
    pageSize: 20,
    threshold: 0.8,
  });

  // Test error handler hook
  const _errorHandler = useErrorHandler({
    maxRetries: 3,
    onError: (_error) => {

    },
    onRetry: (_error, _attempt) => {

    },
  });

  // Test API endpoint directly
  const _testApiEndpoint = async () => {
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
      console.error('Error testing API endpoint:', error);
    }
  };

  return (
    <div>
      <h1>Test Hooks</h1>
      {/* Add hooks testing interface here */}
    </div>
  );
}
