'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  User, 
  Watch,
  Tag,
  Flame,
  Gift
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  itemCount: number;
}

const categories: Category[] = [
  {
    id: 'mens',
    name: "Men's Clothing",
    icon: User,
    color: 'bg-blue-100 text-blue-600',
    itemCount: 124
  },
  {
    id: 'womens',
    name: "Women's Clothing",
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-600',
    itemCount: 189
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: Watch,
    color: 'bg-purple-100 text-purple-600',
    itemCount: 67
  },
  {
    id: 'sale',
    name: 'Sale Items',
    icon: Tag,
    color: 'bg-red-100 text-red-600',
    itemCount: 43
  },
  {
    id: 'new',
    name: 'New Arrivals',
    icon: Flame,
    color: 'bg-orange-100 text-orange-600',
    itemCount: 28
  },
  {
    id: 'featured',
    name: 'Featured',
    icon: Gift,
    color: 'bg-green-100 text-green-600',
    itemCount: 15
  }
];

export default function CategoriesScreen() {
  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 text-sm mt-1">Browse by category</p>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto culturemade-scrollable">
        <div className="px-4 py-6 space-y-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-gray-500 text-sm">{category.itemCount} items</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subcategories Preview */}
        <div className="px-4 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Subcategories</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'T-Shirts', count: 45 },
              { name: 'Jeans', count: 32 },
              { name: 'Sneakers', count: 28 },
              { name: 'Accessories', count: 67 }
            ].map((subcategory, index) => (
              <motion.div
                key={subcategory.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">{subcategory.name}</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{subcategory.name}</h4>
                <p className="text-gray-500 text-xs">{subcategory.count} items</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Development Note */}
        <div className="px-4 pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-medium">📋 Implementation Note</p>
            <p className="text-blue-700 text-xs mt-1">
              Categories will be loaded from the database with real product counts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}