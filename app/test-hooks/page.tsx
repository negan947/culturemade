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

    },
    onRetry: (error, attempt) => {

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
