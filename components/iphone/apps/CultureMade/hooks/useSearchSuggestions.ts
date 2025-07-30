'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'recent' | 'trending';
  image?: string;
  price?: number;
  category?: string;
  productId?: string;
}

interface UseSearchSuggestionsOptions {
  debounceMs?: number;
  maxSuggestions?: number;
  includeRecent?: boolean;
  cacheTimeout?: number;
}

interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  getSuggestions: (query: string) => void;
  clearSuggestions: () => void;
  addToRecentSearches: (query: string) => void;
  getRecentSearches: () => SearchSuggestion[];
}

// Cache for storing search results
const searchCache = new Map<string, { 
  data: SearchSuggestion[], 
  timestamp: number 
}>();

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'culturemade_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function useSearchSuggestions({
  debounceMs = 300,
  maxSuggestions = 8,
  includeRecent = true,
  cacheTimeout = 5 * 60 * 1000, // 5 minutes
}: UseSearchSuggestionsOptions = {}): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController>();

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): SearchSuggestion[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
    } catch {
      return [];
    }
  }, []);

  // Add to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (typeof window === 'undefined' || !query.trim()) return;
    
    try {
      const recent = getRecentSearches();
      const newSearch: SearchSuggestion = {
        id: `recent_${Date.now()}`,
        text: query.trim(),
        type: 'recent',
      };
      
      // Remove if already exists, then add to beginning
      const filtered = recent.filter(item => 
        item.text.toLowerCase() !== query.toLowerCase()
      );
      
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, [getRecentSearches]);

  // Check cache for existing results
  const getCachedResults = useCallback((query: string): SearchSuggestion[] | null => {
    const cached = searchCache.get(query.toLowerCase());
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    if (isExpired) {
      searchCache.delete(query.toLowerCase());
      return null;
    }
    
    return cached.data;
  }, [cacheTimeout]);

  // Cache search results
  const cacheResults = useCallback((query: string, results: SearchSuggestion[]) => {
    searchCache.set(query.toLowerCase(), {
      data: results,
      timestamp: Date.now(),
    });
  }, []);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (
    query: string, 
    signal: AbortSignal
  ): Promise<SearchSuggestion[]> => {
    try {
      const response = await fetch(
        `/api/products/search/suggestions?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`,
        { signal }
      );
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
      
      // Transform API response to our suggestion format
      const suggestions: SearchSuggestion[] = (data.suggestions || []).map((item: any) => {
        if (item.type === 'product' && item.product) {
          return {
            id: item.id,
            text: item.text,
            type: 'product' as const,
            image: item.product.image,
            price: parseFloat(item.product.price),
            productId: item.product.id,
          };
        } else if (item.type === 'category' && item.category) {
          return {
            id: item.id,
            text: item.text,
            type: 'category' as const,
          };
        } else {
          return {
            id: item.id,
            text: item.text,
            type: 'trending' as const,
          };
        }
      });
      
      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      
      console.warn('Search suggestions API error:', error);
      
      // Return mock data as fallback
      return getMockSuggestions(query).slice(0, maxSuggestions);
    }
  }, [maxSuggestions]);

  // Mock suggestions for development/fallback
  const getMockSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const mockData: SearchSuggestion[] = [
      { id: '1', text: 'White T-Shirt', type: 'product', price: 24.99, category: 'Shirts' },
      { id: '2', text: 'Black Jeans', type: 'product', price: 59.99, category: 'Pants' },
      { id: '3', text: 'Sneakers', type: 'category' },
      { id: '4', text: 'Summer Dress', type: 'product', price: 39.99, category: 'Dresses' },
      { id: '5', text: 'Hoodie', type: 'product', price: 49.99, category: 'Outerwear' },
      { id: '6', text: 'Vintage Denim', type: 'trending' },
      { id: '7', text: 'Minimalist Style', type: 'trending' },
      { id: '8', text: 'Streetwear', type: 'category' },
    ];
    
    return mockData.filter(item =>
      item.text.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  // Main function to get suggestions
  const getSuggestions = useCallback((query: string) => {
    // Clear previous timer and abort controller
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }

    // Handle empty query
    if (!query.trim()) {
      if (includeRecent) {
        const recent = getRecentSearches();
        setSuggestions(recent);
      } else {
        setSuggestions([]);
      }
      setIsLoading(false);
      setError(null);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      try {
        // Check cache first
        const cached = getCachedResults(query);
        if (cached) {
          setSuggestions(cached);
          setIsLoading(false);
          return;
        }

        // Create new abort controller
        abortController.current = new AbortController();

        // Fetch from API
        const results = await fetchSuggestions(query, abortController.current.signal);
        
        // Cache the results
        cacheResults(query, results);
        
        setSuggestions(results);
        setIsLoading(false);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        
        console.error('Search suggestions error:', error);
        setError('Failed to load suggestions');
        setIsLoading(false);
        
        // Show recent searches as fallback
        if (includeRecent) {
          setSuggestions(getRecentSearches());
        }
      }
    }, debounceMs);
  }, [
    debounceMs,
    maxSuggestions,
    includeRecent,
    getRecentSearches,
    getCachedResults,
    cacheResults,
    fetchSuggestions,
  ]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

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
    suggestions,
    isLoading,
    error,
    getSuggestions,
    clearSuggestions,
    addToRecentSearches,
    getRecentSearches,
  };
}