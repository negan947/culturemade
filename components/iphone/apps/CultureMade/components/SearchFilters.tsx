'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Tag,
  Star,
  Package,
  TrendingUp,
  Calendar,
  Grid3X3
} from 'lucide-react';
import { useState, useEffect } from 'react';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: 'relevance' | 'price' | 'name' | 'created_at';
  direction: 'asc' | 'desc';
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  priceRanges?: string[];
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose?: () => void;
  categories?: Category[];
  className?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

interface PriceRange {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

const PRICE_RANGES: PriceRange[] = [
  { id: 'under-25', label: 'Under $25', max: 25 },
  { id: '25-50', label: '$25 - $50', min: 25, max: 50 },
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: 'over-200', label: 'Over $200', min: 200 },
];

const SORT_OPTIONS = [
  { 
    value: 'relevance', 
    label: 'Most Relevant', 
    direction: 'desc' as const,
    icon: TrendingUp,
    description: 'Best match for your search'
  },
  { 
    value: 'price', 
    label: 'Price: Low to High', 
    direction: 'asc' as const,
    icon: DollarSign,
    description: 'Lowest price first'
  },
  { 
    value: 'price', 
    label: 'Price: High to Low', 
    direction: 'desc' as const,
    icon: DollarSign,
    description: 'Highest price first'
  },
  { 
    value: 'created_at', 
    label: 'Newest First', 
    direction: 'desc' as const,
    icon: Calendar,
    description: 'Latest arrivals'
  },
  { 
    value: 'name', 
    label: 'A-Z', 
    direction: 'asc' as const,
    icon: Grid3X3,
    description: 'Alphabetical order'
  },
  { 
    value: 'name', 
    label: 'Z-A', 
    direction: 'desc' as const,
    icon: Grid3X3,
    description: 'Reverse alphabetical'
  },
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  onClose,
  categories = [],
  className = "",
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['sort', 'price', 'availability'])
  );
  const [customPriceRange, setCustomPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  });

  // Update custom price range when filters change
  useEffect(() => {
    setCustomPriceRange({
      min: filters.minPrice?.toString() || '',
      max: filters.maxPrice?.toString() || '',
    });
  }, [filters.minPrice, filters.maxPrice]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSortChange = (sort: SearchFilters['sort'], direction: SearchFilters['direction']) => {
    onFiltersChange({ ...filters, sort, direction });
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ 
      ...filters, 
      category: filters.category === categoryId ? undefined : categoryId 
    });
  };

  const handlePriceRangeChange = (range: PriceRange) => {
    onFiltersChange({
      ...filters,
      minPrice: range.min,
      maxPrice: range.max,
    });
  };

  const handleCustomPriceChange = () => {
    const min = customPriceRange.min ? parseFloat(customPriceRange.min) : undefined;
    const max = customPriceRange.max ? parseFloat(customPriceRange.max) : undefined;
    
    // Validate price range
    if (min !== undefined && max !== undefined && min > max) {
      return; // Invalid range
    }
    
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const handleAvailabilityChange = (key: keyof SearchFilters, value: boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sort: 'relevance',
      direction: 'desc',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.inStock) count++;
    if (filters.onSale) count++;
    if (filters.featured) count++;
    return count;
  };

  const isCurrentSort = (sort: string, direction: string) => {
    return filters.sort === sort && filters.direction === direction;
  };

  const isPriceRangeSelected = (range: PriceRange) => {
    return filters.minPrice === range.min && filters.maxPrice === range.max;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-white rounded-t-3xl shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {getActiveFiltersCount() > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* Sort Options */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('sort')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
              <span className="font-medium text-gray-900">Sort By</span>
            </div>
            {expandedSections.has('sort') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('sort') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = isCurrentSort(option.value, option.direction);
                    
                    return (
                      <button
                        key={`${option.value}-${option.direction}`}
                        onClick={() => handleSortChange(option.value as SearchFilters['sort'], option.direction)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-3 ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-left">
                            <div className={`font-medium ${
                              isSelected ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Tag className="w-5 h-5 text-gray-400 mr-3" />
                <span className="font-medium text-gray-900">Categories</span>
              </div>
              {expandedSections.has('categories') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.has('categories') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          filters.category === category.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            filters.category === category.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {category.name}
                          </span>
                          {category.product_count && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({category.product_count})
                            </span>
                          )}
                        </div>
                        {filters.category === category.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Price Range */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <span className="font-medium text-gray-900">Price Range</span>
            </div>
            {expandedSections.has('price') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('price') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {/* Preset Price Ranges */}
                  <div className="space-y-2">
                    {PRICE_RANGES.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => handlePriceRangeChange(range)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isPriceRangeSelected(range)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`font-medium ${
                          isPriceRangeSelected(range) ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {range.label}
                        </span>
                        {isPriceRangeSelected(range) && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Price Range */}
                  <div className="border-t border-gray-200 pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={customPriceRange.min}
                        onChange={(e) => setCustomPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        onBlur={handleCustomPriceChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={customPriceRange.max}
                        onChange={(e) => setCustomPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        onBlur={handleCustomPriceChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Availability */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('availability')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Package className="w-5 h-5 text-gray-400 mr-3" />
              <span className="font-medium text-gray-900">Availability</span>
            </div>
            {expandedSections.has('availability') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('availability') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock || false}
                      onChange={(e) => handleAvailabilityChange('inStock', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">In Stock Only</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.onSale || false}
                      onChange={(e) => handleAvailabilityChange('onSale', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">On Sale</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured || false}
                      onChange={(e) => handleAvailabilityChange('featured', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-gray-700">Featured Products</span>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}