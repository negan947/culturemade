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
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): SearchSuggestion[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }, []);

  // Get suggestions for a query
  const getSuggestions = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSuggestions([]);
      return;
    }

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce the actual API call
    debounceTimer.current = setTimeout(async () => {
      try {
        // Cancel previous request
        if (abortController.current) {
          abortController.current.abort();
        }
        abortController.current = new AbortController();

        const response = await fetch('/api/products/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmedQuery, limit: maxSuggestions }),
          signal: abortController.current.signal,
        });

        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setIsLoading(false);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError(error.message || 'Failed to fetch suggestions');
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);
  }, [debounceMs, maxSuggestions]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    
    // Clear any pending debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Cancel any ongoing request
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  // Add to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (typeof window === 'undefined') return;
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    try {
      const existing = getRecentSearches();
      
      // Remove if already exists
      const filtered = existing.filter(item => item.text.toLowerCase() !== trimmedQuery.toLowerCase());
      
      // Add new search at the beginning
      const newSearch: SearchSuggestion = {
        id: `recent_${Date.now()}`,
        text: trimmedQuery,
        type: 'recent',
      };
      
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, [getRecentSearches]);

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions,
    clearSuggestions,
    addToRecentSearches,
    getRecentSearches,
  };
};

export default useSearchSuggestions;
