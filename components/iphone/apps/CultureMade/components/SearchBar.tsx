'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, 
  X,
  Clock,
  ArrowUpRight,
  Loader2,
  Flame,
  Tag
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useSearchSuggestions, SearchSuggestion } from '../hooks/useSearchSuggestions';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
}

export default function SearchBar({
  placeholder = "Search products...",
  onSearch,
  onSuggestionSelect,
  onFocus,
  onBlur,
  className = "",
  autoFocus = false,
  showSuggestions = true,
  maxSuggestions = 8,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the search suggestions hook
  const {
    suggestions,
    isLoading,
    getSuggestions,
    clearSuggestions,
    addToRecentSearches,
  } = useSearchSuggestions({
    debounceMs,
    maxSuggestions,
    includeRecent: true,
  });

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (showSuggestions) {
      getSuggestions(value);
      setShowDropdown(true);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    if (showSuggestions) {
      getSuggestions(query);
      setShowDropdown(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      onBlur?.();
    }, 200);
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      addToRecentSearches(finalQuery.trim());
      onSearch?.(finalQuery.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    addToRecentSearches(suggestion.text);
    onSuggestionSelect?.(suggestion);
    handleSearch(suggestion.text);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    clearSuggestions();
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'category':
        return <Tag className="w-4 h-4 text-blue-500" />;
      case 'trending':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'product':
      default:
        return <SearchIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        
        <motion.input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            w-full pl-10 pr-10 py-3 
            bg-gray-100 rounded-lg 
            text-gray-900 placeholder-gray-500 
            border-2 border-transparent
            focus:outline-none focus:border-blue-500 focus:bg-white
            transition-all duration-200 ease-out
            ${isFocused ? 'bg-white border-blue-500 shadow-sm' : ''}
          `}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {suggestions.length > 0 ? (
              <div className="py-2">
                {query.trim() === '' && (
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </div>
                )}
                
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full flex items-center px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left"
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium truncate">
                          {suggestion.text}
                        </span>
                        {suggestion.price && (
                          <span className="text-gray-600 font-medium ml-2">
                            {formatPrice(suggestion.price)}
                          </span>
                        )}
                      </div>
                      
                      {suggestion.category && (
                        <div className="text-xs text-gray-500 mt-1">
                          in {suggestion.category}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 ml-2">
                      <ArrowUpRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : !isLoading && query.trim() !== '' && (
              <div className="px-4 py-6 text-center">
                <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No suggestions found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}