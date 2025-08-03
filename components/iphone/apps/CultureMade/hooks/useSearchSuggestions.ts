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
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions,
    clearSuggestions,
    addToRecentSearches,
    getRecentSearches,
  };
};

export default useSearchSuggestions;
