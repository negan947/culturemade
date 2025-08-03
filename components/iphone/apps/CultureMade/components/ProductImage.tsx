'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { getProductImageWithFallback } from '@/lib/utils/image-utils';


interface ProductImageProps {
  src: string | null;
  alt: string;
  productName: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ProductImage({
  src,
  alt,
  productName,
  className = '',
  priority = false,
  sizes = '(max-width: 410px) 50vw, 200px',
  onLoad,
  onError
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get optimized image URL with fallback for real Supabase images only
  const imageUrl = getProductImageWithFallback(src, 'medium', productName);

  // If no valid image URL, show placeholder immediately
  if (!imageUrl) {
    return (
      <div className={`relative aspect-square bg-gray-100 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {

    setImageError(true);
    setIsLoading(false);
    onError?.();
  };


  return (
    <div className={`relative aspect-square bg-gray-100 overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400 animate-pulse" />
        </div>
      )}

      {/* Error State - Show placeholder instead of retry */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Main Image - Only show if we have a real image and no error */}
      {!imageError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover transition-transform duration-300 group-active:scale-105"
            sizes={sizes}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </motion.div>
      )}
    </div>
  );
}