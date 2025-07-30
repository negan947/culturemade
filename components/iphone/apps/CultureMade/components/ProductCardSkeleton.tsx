'use client';

import { memo } from 'react';

const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
      {/* Image Skeleton */}
      <div className="relative aspect-square bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-3 space-y-2">
        {/* Title Skeleton */}
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>

        {/* Price Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-blue-200 rounded w-16 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-1">
          <div className="h-5 bg-gray-100 rounded w-16 animate-pulse"></div>
          <div className="h-5 bg-gray-100 rounded w-12 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
});

export default ProductCardSkeleton;