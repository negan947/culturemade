'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect } from 'react';

import { getProductImageWithFallback } from '@/lib/utils/image-utils';
import { ProductImage } from '@/types/api';


interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

const ProductImageGallery = ({
  images,
  productName,
  className = ''
}: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Placeholder image for missing or failed images
  const placeholderImage = '/images/product-placeholder.svg';
  
  // Ensure we have at least one image (even if it's a placeholder)
  const displayImages = images.length > 0 ? images : [{
    id: 'placeholder',
    url: placeholderImage,
    alt_text: `${productName} - No image available`,
    position: 0
  }];

  const hasMultipleImages = displayImages.length > 1;

  // Handle image load start
  const handleImageLoadStart = useCallback((imageId: string) => {
    setImageLoading(prev => new Set(prev).add(imageId));
  }, []);

  // Handle successful image load
  const handleImageLoad = useCallback((imageId: string) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, []);

  // Handle image load error with retry functionality
  const handleImageError = useCallback((imageId: string) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    setImageErrors(prev => new Set(prev).add(imageId));
  }, []);

  // Retry loading a failed image
  const retryImage = useCallback((imageId: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    handleImageLoadStart(imageId);
  }, [handleImageLoadStart]);

  // Navigate to specific image
  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < displayImages.length) {
      setCurrentIndex(index);
      setIsZoomed(false); // Reset zoom when changing images
    }
  }, [displayImages.length]);

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : displayImages.length - 1;
    goToImage(newIndex);
  }, [currentIndex, displayImages.length, goToImage]);

  // Navigate to next image
  const goToNext = useCallback(() => {
    const newIndex = currentIndex < displayImages.length - 1 ? currentIndex + 1 : 0;
    goToImage(newIndex);
  }, [currentIndex, displayImages.length, goToImage]);

  // Handle swipe gestures with momentum
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50; // Minimum swipe distance
    const velocity = Math.abs(info.velocity.x);
    const offset = Math.abs(info.offset.x);

    if (offset > threshold || velocity > 500) {
      if (info.offset.x > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  }, [goToPrevious, goToNext]);

  // Handle double-tap to zoom (simulating pinch gesture)
  const handleDoubleClick = useCallback(() => {
    setIsZoomed(prev => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      } else if (event.key === 'Escape' && isZoomed) {
        event.preventDefault();
        setIsZoomed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, isZoomed]);

  // Get current image
  const currentImage = displayImages[currentIndex];
  const isCurrentImageLoading = currentImage ? imageLoading.has(currentImage.id) : false;
  const hasCurrentImageError = currentImage ? imageErrors.has(currentImage.id) : false;

  // Guard clause for no images
  if (!currentImage) {
    return (
      <div className={`relative bg-gray-50 ${className}`}>
        <div className="w-full aspect-square flex items-center justify-center">
          <div className="text-gray-400">No image available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-50 ${className}`}>
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden"
        role="img"
        aria-label={`Product image gallery for ${productName}, showing image ${currentIndex + 1} of ${displayImages.length}`}
      >
        {/* Image with swipe gestures */}
        <motion.div
          drag={hasMultipleImages ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.98 }}
          animate={controls}
        >
          <motion.div
            key={currentImage.id}
            className={`relative w-full h-full transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}
            transition={{ 
              type: 'tween', 
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            onDoubleClick={handleDoubleClick}
          >
            {hasCurrentImageError ? (
              <Image
                src={placeholderImage}
                alt={`${productName} - placeholder image`}
                fill
                className="object-cover"
                sizes="(max-width: 410px) 100vw, 400px"
                priority={currentIndex === 0}
              />
            ) : (
              <Image
                src={getProductImageWithFallback(currentImage.url, 'large', productName) || placeholderImage}
                alt={currentImage.alt_text || `${productName} product image ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 410px) 100vw, 400px"
                priority={currentIndex === 0} // Only prioritize first image
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                onLoad={() => handleImageLoad(currentImage.id)}
                onError={() => handleImageError(currentImage.id)}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Loading Skeleton */}
        {isCurrentImageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Error State with Retry */}
        {hasCurrentImageError && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <ZoomIn className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-3">
              Failed to load image
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => retryImage(currentImage.id)}
              className="flex items-center gap-2 px-3 py-2 bg-admin-accent text-white rounded-lg text-sm font-medium active:bg-admin-accent-hover transition-colors"
              style={{ minHeight: '44px' }} // iOS touch target
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </motion.button>
          </div>
        )}

        {/* Navigation Arrows (only show if multiple images) */}
        {hasMultipleImages && !isZoomed && (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm active:bg-black/70 transition-colors"
              aria-label="Previous image"
              style={{ minWidth: '44px', minHeight: '44px' }} // iOS touch target
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm active:bg-black/70 transition-colors"
              aria-label="Next image"
              style={{ minWidth: '44px', minHeight: '44px' }} // iOS touch target
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </>
        )}

        {/* Zoom Indicator */}
        {!isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
            aria-label="Double tap to zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </motion.div>
        )}
      </div>

      {/* Pagination Dots (only show if multiple images) */}
      {hasMultipleImages && (
        <div 
          className="flex justify-center items-center gap-2 py-4"
          role="tablist"
          aria-label="Image gallery navigation"
        >
          {displayImages.map((_, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.8 }}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-admin-accent w-6' 
                  : 'bg-gray-300 active:bg-gray-400'
              }`}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to image ${index + 1}`}
              style={{ minWidth: '24px', minHeight: '24px' }} // iOS touch target with padding
            />
          ))}
        </div>
      )}

      {/* Accessibility Instructions */}
      <div className="sr-only">
        Use arrow keys to navigate between images. Double-click or tap to zoom. 
        Press Escape to exit zoom mode.
      </div>
    </div>
  );
};

export default ProductImageGallery;