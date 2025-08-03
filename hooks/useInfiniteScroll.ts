'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Product types from the API
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  created_at: string;
  variant_count: number;
  min_price: string;
  max_price: string;
  total_inventory: number;
  primary_image: {
    id: string;
    url: string;
    alt_text: string | null;
    position: number;
  } | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
  error?: string;
}

interface UseInfiniteScrollOptions {
  initialPage?: number;
  pageSize?: number;
  threshold?: number; // Intersection threshold (0-1)
  rootMargin?: string; // Root margin for intersection observer
  category?: string;
  search?: string;
  sort?: 'price' | 'name' | 'created_at' | 'featured';
  direction?: 'asc' | 'desc';
  featured?: boolean;
  min_price?: number;
  max_price?: number;
}

interface UseInfiniteScrollReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  refresh: () => void;
  pagination: PaginationInfo | null;
  observerRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const {
    initialPage = 1,
    pageSize = 20,
    threshold = 0.8,
    rootMargin = '100px',
    category,
    search,
    sort = 'created_at',
    direction = 'desc',
    featured,
    min_price,
    max_price,
  } = options;

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Build API URL with parameters
  const buildApiUrl = useCallback((page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    params.set('sort', sort);
    params.set('direction', direction);

    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (featured !== undefined) params.set('featured', featured.toString());
    if (min_price !== undefined) params.set('min_price', min_price.toString());
    if (max_price !== undefined) params.set('max_price', max_price.toString());

    return `/api/products?${params.toString()}`;
  }, [pageSize, sort, direction, category, search, featured, min_price, max_price]);

  // Fetch products for a specific page
  const fetchProducts = useCallback(async (page: number, append = false) => {
    if (loadingRef.current) return;

    setLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      const response = await fetch(buildApiUrl(page), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setPagination(data.pagination);
      setHasMore(data.pagination.has_next);

      if (append) {
        setProducts(prev => {
          // Deduplicate products by ID to prevent duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = data.data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      } else {
        setProducts(data.data);
      }

      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching products';
      setError(errorMessage);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [buildApiUrl]);

  // Load more products (next page)
  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingRef.current) return;
    fetchProducts(currentPage + 1, true);
  }, [hasMore, loading, currentPage, fetchProducts]);

  // Retry failed request
  const retry = useCallback(() => {
    if (loadingRef.current) return;
    setError(null);
    fetchProducts(currentPage, products.length === 0);
  }, [currentPage, fetchProducts, products.length]);

  // Refresh from beginning
  const refresh = useCallback(() => {
    if (loadingRef.current) return;
    setProducts([]);
    setCurrentPage(initialPage);
    setError(null);
    setHasMore(true);
    fetchProducts(initialPage, false);
  }, [initialPage, fetchProducts]);

  // Intersection Observer callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry && entry.isIntersecting && hasMore && !loading && !loadingRef.current) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // Observer ref callback
  const observerRefCallback = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold,
        rootMargin,
      });
      observerRef.current.observe(node);
    }
  }, [handleIntersection, threshold, rootMargin]);

  // Load initial data when dependencies change
  useEffect(() => {
    refresh();
  }, [category, search, sort, direction, featured, min_price, max_price]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
    refresh,
    pagination,
    observerRef: observerRefCallback,
  };
}