/**
 * Image Utility Functions
 * Handles Supabase storage image URLs and transformations
 */

// Supabase project URL from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Generate Supabase storage image URL
 */
export function getStorageImageUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL not found');
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Generate transformed image URL using Supabase Image Transformation
 */
export function getTransformedImageUrl(
  bucket: string,
  path: string,
  options: ImageTransformOptions = {}
): string {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL not found');
  }

  const params = new URLSearchParams();

  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);
  if (options.resize) params.append('resize', options.resize);

  const baseUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}`;
  const queryString = params.toString();

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Product image URL generators with preset transformations
 */
export const productImageUrl = {
  /**
   * Original product image
   */
  original: (imagePath: string): string => {
    return getStorageImageUrl('product-images', imagePath);
  },

  /**
   * Thumbnail - 200x200px, WebP, 80% quality
   */
  thumbnail: (imagePath: string): string => {
    return getTransformedImageUrl('product-images', imagePath, {
      width: 200,
      height: 200,
      quality: 80,
      format: 'webp',
      resize: 'cover',
    });
  },

  /**
   * Medium - 400x400px, WebP, 85% quality
   */
  medium: (imagePath: string): string => {
    return getTransformedImageUrl('product-images', imagePath, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp',
      resize: 'cover',
    });
  },

  /**
   * Large - 800x800px, WebP, 90% quality
   */
  large: (imagePath: string): string => {
    return getTransformedImageUrl('product-images', imagePath, {
      width: 800,
      height: 800,
      quality: 90,
      format: 'webp',
      resize: 'cover',
    });
  },
};


/**
 * Get product image URL for real Supabase storage paths only
 * Returns null for missing/invalid paths - let component handle placeholders
 */
export function getProductImageWithFallback(
  imagePath: string | null | undefined,
  size: 'thumbnail' | 'medium' | 'large' = 'medium',
  productName?: string
): string | null {
  // If no image path, return null - let component show placeholder
  if (!imagePath) {
    return null;
  }

  // If it's a placeholder URL, treat as no image
  if (imagePath.includes('placeholder')) {
    return null;
  }

  // If already a complete URL from external source and it's a real image, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Only allow Supabase URLs for now
    if (imagePath.includes('supabase.co')) {
      return imagePath;
    }
    return null;
  }

  // If Supabase URL is not available, return null
  if (!SUPABASE_URL) {
    return null;
  }

  // Otherwise, treat as Supabase storage path
  return productImageUrl[size](imagePath);
}

/**
 * Category image URL generators
 */
export const categoryImageUrl = {
  original: (imagePath: string): string => {
    return getStorageImageUrl('category-images', imagePath);
  },

  thumbnail: (imagePath: string): string => {
    return getTransformedImageUrl('category-images', imagePath, {
      width: 150,
      height: 150,
      quality: 80,
      format: 'webp',
      resize: 'cover',
    });
  },
};

/**
 * Variant image URL generators
 */
export const variantImageUrl = {
  original: (imagePath: string): string => {
    return getStorageImageUrl('variant-images', imagePath);
  },

  thumbnail: (imagePath: string): string => {
    return getTransformedImageUrl('variant-images', imagePath, {
      width: 100,
      height: 100,
      quality: 80,
      format: 'webp',
      resize: 'cover',
    });
  },
};

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];
  return validTypes.includes(file.type);
}

/**
 * Validate image file size (5MB limit)
 */
export function isValidImageSize(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  return file.size <= maxSize;
}

/**
 * Generate optimized image file name
 */
export function generateImageFileName(
  originalName: string,
  productSlug?: string
): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();

  if (productSlug) {
    return `${productSlug}-${timestamp}.${extension}`;
  }

  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${sanitizedName}-${timestamp}.${extension}`;
}
