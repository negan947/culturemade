'use client';

import { motion } from 'framer-motion';
import { Tag, Package, Star, Clock, Truck, Shield } from 'lucide-react';
import { memo } from 'react';

import { ProductListItem } from '@/types/api';
import { PricingInfo } from '@/utils/pricingUtils';


interface ComponentInventoryStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantity: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

interface ProductInfoSectionProps {
  product: ProductListItem;
  pricingInfo: PricingInfo | null;
  inventoryStatus: ComponentInventoryStatus | null;
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
    } catch (error) {
      return 'Date unavailable';
    }
  };

  const getStatusBadgeColor = (urgency: ComponentInventoryStatus['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Price Section */}
      <div className="space-y-2">
        {pricingInfo && (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {pricingInfo.displayPrice}
            </span>
            {pricingInfo.originalPrice && (
              <span className="text-lg text-gray-500 line-through">
                {pricingInfo.originalPrice}
              </span>
            )}
            {pricingInfo.isOnSale && (
              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                Sale
              </span>
            )}
          </div>
        )}
        
        {pricingInfo?.discountPercentage && (
          <div className="text-sm text-green-600 font-medium">
            Save {pricingInfo.discountPercentage}%
          </div>
        )}
      </div>

      {/* Inventory Status */}
      {inventoryStatus && (
        <div className="flex items-center gap-2">
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
            ${getStatusBadgeColor(inventoryStatus.urgency)}
          `}>
            <Package className="w-4 h-4 mr-1" />
            {inventoryStatus.message}
          </div>
          {inventoryStatus.quantity > 0 && inventoryStatus.urgency !== 'low' && (
            <span className="text-sm text-gray-600">
              ({inventoryStatus.quantity} left)
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Tag className="w-4 h-4 mr-2 text-gray-400" />
            Description
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* Categories */}
      {product.categories && product.categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Tag className="w-4 h-4 mr-2 text-gray-400" />
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Product Features */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            Secure Payment
          </div>
          <div className="flex items-center text-gray-600">
            <Truck className="w-4 h-4 mr-2 text-blue-500" />
            Free Shipping
          </div>
          <div className="flex items-center text-gray-600">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Quality Guaranteed
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-purple-500" />
            Fast Delivery
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductInfoSection;
