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

    return {
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
    };
  };

  export default useSearch;
