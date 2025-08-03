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

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const sessionId = useRef<string>(`search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

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

  // Main search function
  const search = useCallback(async (query: string, filters?: Partial<SearchFilters>) => {
    const searchQuery = query.trim();
    if (!searchQuery) return;

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const finalFilters = { ...state.filters, ...filters };
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, filters: finalFilters, page: 1 }),
        signal: abortController.current.signal,
      });

      if (!response.ok) throw new Error('Search failed');

      const data: SearchResponse = await response.json();
      
      setState(prev => ({
        ...prev,
        query: searchQuery,
        filters: finalFilters,
        results: data.data || [],
        pagination: data.pagination,
        searchInfo: data.search_info,
        loading: false,
        hasSearched: true,
      }));

      if (trackAnalytics && data.search_info) {
        trackSearchAnalytics(searchQuery, finalFilters, data.data?.length || 0, data.search_info.search_time_ms);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({ ...prev, loading: false, error: error.message || 'Search failed' }));
      }
    }
  }, [state.filters, trackAnalytics, trackSearchAnalytics]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (!state.pagination?.has_next || state.loading) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: state.query, 
          filters: state.filters, 
          page: state.pagination.page + 1 
        }),
      });

      if (!response.ok) throw new Error('Load more failed');

      const data: SearchResponse = await response.json();
      
      setState(prev => ({
        ...prev,
        results: [...prev.results, ...(data.data || [])],
        pagination: data.pagination,
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message || 'Load more failed' }));
    }
  }, [state.query, state.filters, state.pagination, state.loading]);

  // Update filters
  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, ...filters } }));
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
  }, []);

  // Retry last search
  const retry = useCallback(async () => {
    if (state.query) {
      await search(state.query, state.filters);
    }
  }, [state.query, state.filters, search]);

  // Set search query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

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

    return {
      query: state.query,
      filters: state.filters,
      results: state.results,
      pagination: state.pagination,
      searchInfo: state.searchInfo,
      loading: state.loading,
      error: state.error,
      hasSearched: state.hasSearched,
      search,
      loadMore,
      updateFilters,
      clearSearch,
      retry,
      setQuery,
    };
  };

  export default useSearch;
