'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { ProductListItem } from '@/types/api';

import { SearchFilters } from '../components/SearchFilters';

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: ProductListItem[];
  pagination: SearchPagination | null;
  searchInfo: SearchInfo | null;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface SearchInfo {
  query: string;
  filters_applied: string[];
  search_time_ms: number;
}

interface SearchResponse {
  success: boolean;
  data: any[];
  pagination: SearchPagination;
  search_info: SearchInfo;
  error?: string;
}

interface UseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  cacheResults?: boolean;
  trackAnalytics?: boolean;
}

interface UseSearchReturn extends SearchState {
  search: (query: string, filters?: Partial<SearchFilters>) => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  retry: () => Promise<void>;
  setQuery: (query: string) => void;
}

// Default search filters
const DEFAULT_FILTERS: SearchFilters = {
  sort: 'relevance',
  direction: 'desc',
};

// Cache for storing search results
const searchCache = new Map<string, { 
  data: SearchResponse, 
  timestamp: number 
}>();

// Analytics tracking
const SEARCH_ANALYTICS_KEY = 'culturemade_search_analytics';
const MAX_ANALYTICS_EVENTS = 100;

interface SearchAnalyticsEvent {
  query: string;
  filters: SearchFilters;
  resultCount: number;
  searchTime: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export function useSearch({
  debounceMs = 300,
  autoSearch = false,
  cacheResults = true,
  trackAnalytics = true,
}: UseSearchOptions = {}): UseSearchReturn {
  const [state, setState] = useState<SearchState>({
    query: '',
    filters: DEFAULT_FILTERS,
    results: [],
    pagination: null,
    searchInfo: null,
    loading: false,
    error: null,
    hasSearched: false,
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController>();
  const sessionId = useRef<string>(`search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Generate cache key
  const getCacheKey = useCallback((query: string, filters: SearchFilters, page: number) => {
    return JSON.stringify({ query: query.trim().toLowerCase(), filters, page });
  }, []);

  // Check cache for existing results
  const getCachedResults = useCallback((query: string, filters: SearchFilters, page: number): SearchResponse | null => {
    if (!cacheResults) return null;
    
    const key = getCacheKey(query, filters, page);
    const cached = searchCache.get(key);
    
    if (!cached) return null;
    
    // Cache expires after 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      searchCache.delete(key);
      return null;
    }
    
    return cached.data;
  }, [cacheResults, getCacheKey]);

  // Cache search results
  const cacheSearchResults = useCallback((
    query: string, 
    filters: SearchFilters, 
    page: number, 
    response: SearchResponse
  ) => {
    if (!cacheResults) return;
    
    const key = getCacheKey(query, filters, page);
    searchCache.set(key, {
      data: response,
      timestamp: Date.now(),
    });
  }, [cacheResults, getCacheKey]);

  // Track search analytics
  const trackSearchAnalytics = useCallback((
    query: string,
    filters: SearchFilters,
    resultCount: number,
    searchTime: number
  ) => {
    if (!trackAnalytics || typeof window === 'undefined') return;

    try {
      const event: SearchAnalyticsEvent = {
        query: query.trim(),
        filters,
        resultCount,
        searchTime,
        timestamp: Date.now(),
        sessionId: sessionId.current,
      };

      // Get existing analytics
      const existingJson = localStorage.getItem(SEARCH_ANALYTICS_KEY);
      const existing = existingJson ? JSON.parse(existingJson) : [];
      
      // Add new event and keep only the latest events
      const updated = [event, ...existing].slice(0, MAX_ANALYTICS_EVENTS);
      
      localStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(updated));

      // Also send to server analytics if available
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }).catch(() => {
          // Ignore analytics errors
        });
      }
    } catch (error) {
      console.warn('Failed to track search analytics:', error);
    }
  }, [trackAnalytics]);

  // Transform API response to ProductListItem format
  const transformSearchResults = useCallback((apiResults: any[]): ProductListItem[] => {
    return apiResults.map(item => ({
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
      variant_count: 0, // This field is required by ProductListItem
    }));
  }, []);

  // Perform search API call
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters,
    page: number = 1,
    append: boolean = false
  ): Promise<void> => {
    if (!query.trim()) {
      setState(prev => ({
        ...prev,
        results: [],
        pagination: null,
        searchInfo: null,
        hasSearched: false,
        error: null,
      }));
      return;
    }

    // Check cache first
    const cached = getCachedResults(query, filters, page);
    if (cached && page === 1) {
      const transformedResults = transformSearchResults(cached.data);
      setState(prev => ({
        ...prev,
        results: transformedResults,
        pagination: cached.pagination,
        searchInfo: cached.search_info,
        loading: false,
        error: null,
        hasSearched: true,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      hasSearched: true,
    }));

    try {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      // Build search parameters
      const params = new URLSearchParams({
        q: query.trim(),
        page: page.toString(),
        limit: '20',
        sort: filters.sort,
        direction: filters.direction,
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('min_price', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('max_price', filters.maxPrice.toString());

      const startTime = Date.now();
      const response = await fetch(`/api/products/search?${params}`, {
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      const searchTime = Date.now() - startTime;
      const transformedResults = transformSearchResults(data.data);

      // Cache the results
      cacheSearchResults(query, filters, page, data);

      // Track analytics
      trackSearchAnalytics(query, filters, transformedResults.length, searchTime);

      setState(prev => ({
        ...prev,
        results: append ? [...prev.results, ...transformedResults] : transformedResults,
        pagination: data.pagination,
        searchInfo: data.search_info,
        loading: false,
        error: null,
      }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      console.error('Search error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
        results: page === 1 ? [] : prev.results,
      }));
    }
  }, [getCachedResults, transformSearchResults, cacheSearchResults, trackSearchAnalytics]);

  // Debounced search function
  const debouncedSearch = useCallback((query: string, filters: SearchFilters) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query, filters, 1, false);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  // Public search function
  const search = useCallback(async (
    query: string, 
    newFilters: Partial<SearchFilters> = {}
  ) => {
    const filters = { ...state.filters, ...newFilters };
    setState(prev => ({ ...prev, query, filters }));
    
    if (autoSearch) {
      debouncedSearch(query, filters);
    } else {
      await performSearch(query, filters, 1, false);
    }
  }, [state.filters, autoSearch, debouncedSearch, performSearch]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (!state.pagination?.has_next || state.loading) return;
    
    await performSearch(
      state.query, 
      state.filters, 
      state.pagination.page + 1, 
      true
    );
  }, [state.pagination, state.loading, state.query, state.filters, performSearch]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const filters = { ...state.filters, ...newFilters };
    setState(prev => ({ ...prev, filters }));
    
    if (state.query.trim()) {
      if (autoSearch) {
        debouncedSearch(state.query, filters);
      } else {
        performSearch(state.query, filters, 1, false);
      }
    }
  }, [state.filters, state.query, autoSearch, debouncedSearch, performSearch]);

  // Set query without searching
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setState({
      query: '',
      filters: DEFAULT_FILTERS,
      results: [],
      pagination: null,
      searchInfo: null,
      loading: false,
      error: null,
      hasSearched: false,
    });

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  // Retry search
  const retry = useCallback(async () => {
    if (state.query.trim()) {
      await performSearch(state.query, state.filters, 1, false);
    }
  }, [state.query, state.filters, performSearch]);

  // Auto-search when query changes (if enabled)
  useEffect(() => {
    if (autoSearch && state.query.trim()) {
      debouncedSearch(state.query, state.filters);
    }
  }, [autoSearch, state.query, state.filters, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    search,
    loadMore,
    updateFilters,
    clearSearch,
    retry,
    setQuery,
  };
}