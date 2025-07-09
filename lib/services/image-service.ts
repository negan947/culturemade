// Image Upload and Optimization Service for CultureMade E-Commerce
// Handles image uploads, optimization, and serving with Supabase Storage

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ImageUploadOptions {
  bucket: string
  folder?: string
  filename?: string
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
}

export interface ImageUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
  metadata?: {
    size: number
    width: number
    height: number
    format: string
  }
}

export interface OptimizedImageUrls {
  original: string
  thumbnail: string // 150x150
  small: string     // 300x300
  medium: string    // 600x600
  large: string     // 1200x1200
}

// =============================================================================
// STORAGE BUCKETS CONFIGURATION
// =============================================================================

export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  VARIANT_IMAGES: 'variant-images',
  CATEGORY_IMAGES: 'category-images',
  COLLECTION_IMAGES: 'collection-images'
} as const

export const IMAGE_FOLDERS = {
  PRODUCTS: 'products',
  VARIANTS: 'variants', 
  CATEGORIES: 'categories',
  COLLECTIONS: 'collections',
  TEMP: 'temp'
} as const

// =============================================================================
// IMAGE VALIDATION
// =============================================================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/avif'
] as const

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES_PER_PRODUCT = 10

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  return { isValid: true }
}

// =============================================================================
// IMAGE PROCESSING UTILITIES
// =============================================================================

export function generateImagePath(
  bucket: string,
  folder: string,
  filename: string
): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  return `${folder}/${timestamp}_${randomString}_${cleanFilename}`
}

export function getOptimizedImageUrl(
  path: string,
  bucket: string,
  transformation?: {
    width?: number
    height?: number
    quality?: number
    format?: string
  }
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  
  if (!transformation) {
    return data.publicUrl
  }

  // For Supabase, we'll use transform parameters if available
  // Note: This requires Supabase Pro plan for image transformations
  const params = new URLSearchParams()
  
  if (transformation.width) params.append('width', transformation.width.toString())
  if (transformation.height) params.append('height', transformation.height.toString())
  if (transformation.quality) params.append('quality', transformation.quality.toString())
  if (transformation.format) params.append('format', transformation.format)

  return `${data.publicUrl}?${params.toString()}`
}

// =============================================================================
// CORE IMAGE SERVICE CLASS
// =============================================================================

export class ImageService {
  private supabase = supabase

  /**
   * Upload a single image to Supabase Storage
   */
  async uploadImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<ImageUploadResult> {
    try {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Generate file path
      const folder = options.folder || IMAGE_FOLDERS.TEMP
      const filename = options.filename || file.name
      const path = generateImagePath(options.bucket, folder, filename)

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        metadata: {
          size: file.size,
          width: 0, // Would need image processing library to get dimensions
          height: 0,
          format: file.type
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: File[],
    options: ImageUploadOptions
  ): Promise<ImageUploadResult[]> {
    const results = await Promise.all(
      files.map(file => this.uploadImage(file, options))
    )

    return results
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get optimized image URLs for different sizes
   */
  getOptimizedUrls(path: string, bucket: string): OptimizedImageUrls {
    return {
      original: getOptimizedImageUrl(path, bucket),
      thumbnail: getOptimizedImageUrl(path, bucket, { width: 150, height: 150, quality: 80 }),
      small: getOptimizedImageUrl(path, bucket, { width: 300, height: 300, quality: 85 }),
      medium: getOptimizedImageUrl(path, bucket, { width: 600, height: 600, quality: 90 }),
      large: getOptimizedImageUrl(path, bucket, { width: 1200, height: 1200, quality: 95 })
    }
  }

  /**
   * Move image from temp folder to permanent location
   */
  async moveImage(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Copy file to new location
      const { error: copyError } = await this.supabase.storage
        .from(bucket)
        .copy(fromPath, toPath)

      if (copyError) {
        return { success: false, error: copyError.message }
      }

      // Delete original file
      const { error: deleteError } = await this.supabase.storage
        .from(bucket)
        .remove([fromPath])

      if (deleteError) {
        // Log error but don't fail the operation
        console.error('Failed to delete original file:', deleteError.message)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate signed URL for private images
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, url: data.signedUrl }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// =============================================================================
// PRODUCT-SPECIFIC IMAGE OPERATIONS
// =============================================================================

export class ProductImageService extends ImageService {
  /**
   * Upload product images
   */
  async uploadProductImages(
    productId: string,
    files: File[],
    variantId?: string
  ): Promise<{
    success: boolean
    images: Array<{ url: string; path: string; position: number }>
    error?: string
  }> {
    try {
      if (files.length > MAX_IMAGES_PER_PRODUCT) {
        return {
          success: false,
          images: [],
          error: `Too many images. Maximum allowed: ${MAX_IMAGES_PER_PRODUCT}`
        }
      }

      const bucket = variantId ? STORAGE_BUCKETS.VARIANT_IMAGES : STORAGE_BUCKETS.PRODUCT_IMAGES
      const folder = variantId 
        ? `${IMAGE_FOLDERS.VARIANTS}/${productId}/${variantId}`
        : `${IMAGE_FOLDERS.PRODUCTS}/${productId}`

      const uploadResults = await this.uploadImages(files, { bucket, folder })

      const successfulUploads = uploadResults
        .filter(result => result.success)
        .map((result, index) => ({
          url: result.url!,
          path: result.path!,
          position: index
        }))

      const errors = uploadResults
        .filter(result => !result.success)
        .map(result => result.error)

      if (successfulUploads.length === 0) {
        return {
          success: false,
          images: [],
          error: `All uploads failed: ${errors.join(', ')}`
        }
      }

      return {
        success: true,
        images: successfulUploads,
        error: errors.length > 0 ? `Some uploads failed: ${errors.join(', ')}` : undefined
      }
    } catch (error) {
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete product images
   */
  async deleteProductImages(
    productId: string,
    imagePaths: string[],
    variantId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bucket = variantId ? STORAGE_BUCKETS.VARIANT_IMAGES : STORAGE_BUCKETS.PRODUCT_IMAGES

      const deletePromises = imagePaths.map(path => this.deleteImage(bucket, path))
      const results = await Promise.all(deletePromises)

      const failures = results.filter(result => !result.success)

      if (failures.length > 0) {
        return {
          success: false,
          error: `Failed to delete ${failures.length} images`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reorder product images
   */
  async reorderProductImages(
    imageIds: string[],
    productId: string,
    variantId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update position in product_images table
      const updates = imageIds.map((id, index) => ({
        id,
        position: index
      }))

      // This would typically be done in a single transaction
      // For now, we'll update each image individually
      for (const update of updates) {
        const { error } = await this.supabase
          .from('product_images')
          .update({ position: update.position })
          .eq('id', update.id)

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCES
// =============================================================================

export const imageService = new ImageService()
export const productImageService = new ProductImageService()

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get image URL with transformations for iPhone display
 */
export function getIPhoneOptimizedUrl(
  path: string,
  bucket: string,
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): string {
  const sizeMap = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  }

  return getOptimizedImageUrl(path, bucket, {
    ...sizeMap[size],
    quality: 90,
    format: 'webp'
  })
}

/**
 * Preload images for better iPhone performance
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })

  return Promise.all(promises)
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImageUrl(
  width: number = 400,
  height: number = 400,
  text: string = 'No Image'
): string {
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/666666?text=${encodeURIComponent(text)}`
}

/**
 * Check if URL is a valid image
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return contentType?.startsWith('image/') ?? false
  } catch {
    return false
  }
} 