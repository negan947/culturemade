'use client'

import { productImageUrl, getProductImageWithFallback, generatePlaceholderImage } from '@/lib/utils/image-utils'
import Image from 'next/image'

export default function TestImagesPage() {
  const testImagePath = 'shirts/classic-white-tshirt.jpg'
  const testProductName = 'Classic White T-Shirt'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Image Utilities Test</h1>
        
        {/* Test Original URLs */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Original Image URLs</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Product Image (Real Path):</p>
            <code className="block bg-gray-100 p-2 rounded text-xs mb-4 break-all">
              {productImageUrl.original(testImagePath)}
            </code>
            
            <p className="text-sm text-gray-600 mb-2">Placeholder Image:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              {generatePlaceholderImage(400, 400, 'classic-white-tshirt')}
            </code>
          </div>
        </section>

        {/* Test Transformed URLs */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Transformed Image URLs</h2>
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Thumbnail (200x200):</p>
              <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                {productImageUrl.thumbnail(testImagePath)}
              </code>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Medium (400x400):</p>
              <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                {productImageUrl.medium(testImagePath)}
              </code>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Large (800x800):</p>
              <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                {productImageUrl.large(testImagePath)}
              </code>
            </div>
          </div>
        </section>

        {/* Test Fallback System */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fallback System Test</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Thumbnail Fallback</h3>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getProductImageWithFallback(null, 'thumbnail', testProductName)}
                    alt="Thumbnail test"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Should show placeholder</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Medium Fallback</h3>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getProductImageWithFallback(null, 'medium', testProductName)}
                    alt="Medium test"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Should show placeholder</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Large Fallback</h3>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getProductImageWithFallback(null, 'large', testProductName)}
                    alt="Large test"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Should show placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Test Different Placeholder Seeds */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Placeholder Variety Test</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['classic-white-tshirt', 'vintage-denim-jacket', 'cotton-hoodie', 'polo-shirt'].map((seed) => (
                <div key={seed} className="text-center">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={generatePlaceholderImage(200, 200, seed)}
                      alt={`${seed} placeholder`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-600">{seed}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Environment Info */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Info</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Supabase URL:</span>{' '}
                <span className="font-mono text-xs">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing'}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Base Storage URL:</span>{' '}
                <span className="font-mono text-xs break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Transform URL:</span>{' '}
                <span className="font-mono text-xs break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/product-images/
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}