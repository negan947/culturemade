'use client';

import { motion } from 'framer-motion';
import { Tag, Package, Star, Clock, Truck, Shield } from 'lucide-react';
import { memo } from 'react';

import { ProductListItem } from '@/types/api';
import { PricingInfo } from '@/utils/pricingUtils';


interface InventoryStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantity: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

interface ProductInfoSectionProps {
  product: ProductListItem;
  pricingInfo: PricingInfo | null;
  inventoryStatus: InventoryStatus | null;
  className?: string;
}

const ProductInfoSection = memo(function ProductInfoSection({
  product,
  pricingInfo,
  inventoryStatus,
  className = ''
}: ProductInfoSectionProps) {
  
  // Format created date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Get inventory status color and icon
  const getInventoryDisplay = () => {
    if (!inventoryStatus) return null;

    const { status, quantity, message, urgency } = inventoryStatus;
    
    let colorClass = '';
    let bgClass = '';
    let icon = Package;

    switch (status) {
      case 'out_of_stock':
        colorClass = 'text-red-600';
        bgClass = 'bg-red-50';
        icon = Package;
        break;
      case 'low_stock':
        colorClass = 'text-orange-600';
        bgClass = 'bg-orange-50';
        icon = Clock;
        break;
      case 'in_stock':
        colorClass = 'text-green-600';
        bgClass = 'bg-green-50';
        icon = Package;
        break;
    }

    const Icon = icon;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgClass}`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className={`text-sm font-medium ${colorClass}`}>
          {message}
        </span>
        {status === 'low_stock' && (
          <span className="text-xs text-gray-500">
            ({quantity} left)
          </span>
        )}
      </div>
    );
  };

  // Get sale badge if product is on sale
  const getSaleBadge = () => {
    if (!pricingInfo?.isOnSale || !pricingInfo.discountPercentage) return null;

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
      >
        <Tag className="w-3 h-3" />
        {pricingInfo.discountPercentage}% OFF
      </motion.div>
    );
  };

  // Get featured badge if product is featured
  const getFeaturedBadge = () => {
    if (!product.featured) return null;

    return (
      <div className="inline-flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
        <Star className="w-3 h-3" />
        Featured
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Name and Badges */}
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          {product.name}
        </h1>
        
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {getSaleBadge()}
          {getFeaturedBadge()}
        </div>
      </div>

      {/* Pricing Section */}
      {pricingInfo && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-blue-600">
              {pricingInfo.displayPrice}
            </span>
            {pricingInfo.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {pricingInfo.originalPrice}
              </span>
            )}
          </div>
          
          {pricingInfo.hasVariablePricing && (
            <p className="text-sm text-gray-600">
              Price varies by size and color selection
            </p>
          )}
        </div>
      )}

      {/* Inventory Status */}
      <div>
        {getInventoryDisplay()}
      </div>

      {/* Product Description */}
      {product.description && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Description</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Product Categories */}
      {product.categories && product.categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Product Metadata */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
        
        <div className="grid grid-cols-1 gap-3 text-sm">
          {/* Product ID */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Product ID</span>
            <span className="font-medium text-gray-900 font-mono text-xs">
              {product.id.slice(0, 8)}...
            </span>
          </div>

          {/* Variants Count */}
          {product.variant_count > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Available Variants</span>
              <span className="font-medium text-gray-900">
                {product.variant_count} options
              </span>
            </div>
          )}

          {/* Total Inventory */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Stock Level</span>
            <span className="font-medium text-gray-900">
              {product.total_inventory} units
            </span>
          </div>

          {/* Added Date */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Added</span>
            <span className="font-medium text-gray-900">
              {formatDate(product.created_at)}
            </span>
          </div>

          {/* Product Status */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Status</span>
            <span className={`font-medium capitalize ${
              product.status === 'active' ? 'text-green-600' :
              product.status === 'draft' ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {product.status}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Why Choose Us</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Free Shipping</p>
              <p className="text-xs text-gray-600">On orders over $50</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">30-Day Returns</p>
              <p className="text-xs text-gray-600">Easy returns & exchanges</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Quality Guarantee</p>
              <p className="text-xs text-gray-600">Premium materials & craftsmanship</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for Bottom Navigation */}
      <div className="h-8" />
    </div>
  );
});

export default ProductInfoSection;