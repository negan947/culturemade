/**
 * CartItem Component - Individual cart item display with quantity controls
 * Reusable component for displaying cart items in various contexts
 */

import { motion } from 'framer-motion';
import { Plus, Minus, X } from 'lucide-react';
import React, { useState } from 'react';

import ProductImage from './ProductImage';

interface CartItemData {
  id: string;
  product_name: string;
  variant_title?: string;
  price: number;
  quantity: number;
  total: number;
  image_url?: string;
  image_alt?: string;
  inventory_quantity?: number;
  is_available?: boolean;
}

interface CartItemProps {
  item: CartItemData;
  onQuantityUpdate: (cartItemId: string, newQuantity: number) => Promise<boolean>;
  onRemove: (cartItemId: string) => Promise<void>;
  isRemoving?: boolean;
  isUpdating?: boolean;
  showImage?: boolean;
  showRemove?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CartItem({
  item,
  onQuantityUpdate,
  onRemove,
  isRemoving = false,
  isUpdating = false,
  showImage = true,
  showRemove = true,
  size = 'md',
  className = ''
}: CartItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setIsLoading(true);
    try {
      await onQuantityUpdate(item.id, newQuantity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: {
      container: 'p-2',
      image: 'w-10 h-10',
      title: 'text-xs',
      variant: 'text-xs',
      price: 'text-xs',
      button: 'p-1 w-6 h-6',
      icon: 'h-3 w-3',
      quantity: 'text-xs w-4'
    },
    md: {
      container: 'p-3',
      image: 'w-14 h-14',
      title: 'text-sm',
      variant: 'text-xs',
      price: 'text-sm',
      button: 'p-1.5 w-7 h-7',
      icon: 'h-3 w-3',
      quantity: 'text-sm w-6'
    },
    lg: {
      container: 'p-4',
      image: 'w-16 h-16',
      title: 'text-base',
      variant: 'text-sm',
      price: 'text-base',
      button: 'p-2 w-8 h-8',
      icon: 'h-4 w-4',
      quantity: 'text-base w-8'
    }
  };

  const currentSize = sizeClasses[size];
  const isDisabled = isLoading || isRemoving || isUpdating;
  const isOutOfStock = item.inventory_quantity === 0 || !item.is_available;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        flex items-center space-x-3 
        bg-admin-bg-surface rounded-xl 
        ${currentSize.container}
        ${isOutOfStock ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Product Image */}
      {showImage && (
        <div className="flex-shrink-0">
          <ProductImage
            src={item.image_url || null}
            alt={item.image_alt || item.product_name}
            productName={item.product_name}
            className={`${currentSize.image} rounded-lg`}
          />
        </div>
      )}

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium text-admin-text-primary truncate ${currentSize.title}`}>
          {item.product_name}
        </h4>
        
        {item.variant_title && (
          <p className={`text-admin-text-secondary truncate ${currentSize.variant}`}>
            {item.variant_title}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-1">
          <span className={`font-semibold text-admin-accent ${currentSize.price}`}>
            {formatPrice(item.price)}
          </span>
          <span className={`text-admin-text-secondary ${currentSize.variant}`}>
            Total: {formatPrice(item.total)}
          </span>
        </div>

        {/* Stock Status */}
        {isOutOfStock && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            Out of Stock
          </p>
        )}
        
        {item.inventory_quantity && item.inventory_quantity <= 5 && item.inventory_quantity > 0 && (
          <p className="text-orange-500 text-xs mt-1">
            Only {item.inventory_quantity} left
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1">
        {/* Quantity Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isDisabled || item.quantity <= 1}
            className={`
              ${currentSize.button}
              text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg-hover 
              rounded-full transition-colors 
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            `}
            aria-label="Decrease quantity"
          >
            <Minus className={currentSize.icon} />
          </button>
          
          <span className={`
            ${currentSize.quantity} text-center font-medium text-admin-text-primary
          `}>
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isDisabled || Boolean(item.inventory_quantity && item.quantity >= item.inventory_quantity)}
            className={`
              ${currentSize.button}
              text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg-hover 
              rounded-full transition-colors 
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            `}
            aria-label="Increase quantity"
          >
            <Plus className={currentSize.icon} />
          </button>
        </div>

        {/* Remove Button */}
        {showRemove && (
          <button
            onClick={handleRemove}
            disabled={isDisabled}
            className={`
              ${currentSize.button}
              text-admin-text-disabled hover:text-red-600 hover:bg-red-50 
              rounded-full transition-colors 
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center ml-1
            `}
            aria-label={`Remove ${item.product_name} from cart`}
          >
            {isRemoving || isLoading ? (
              <div className={`
                animate-spin rounded-full border border-red-600 border-t-transparent
                ${currentSize.icon}
              `} />
            ) : (
              <X className={currentSize.icon} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * CartItemSkeleton - Loading skeleton for cart items
 */
interface CartItemSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  showImage?: boolean;
  className?: string;
}

export function CartItemSkeleton({ 
  size = 'md', 
  showImage = true, 
  className = '' 
}: CartItemSkeletonProps) {
  const sizeClasses = {
    sm: { container: 'p-2', image: 'w-10 h-10' },
    md: { container: 'p-3', image: 'w-14 h-14' },
    lg: { container: 'p-4', image: 'w-16 h-16' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`
      flex items-center space-x-3 
      bg-admin-bg-surface rounded-xl 
      ${currentSize.container}
      animate-pulse
      ${className}
    `}>
      {/* Image Skeleton */}
      {showImage && (
        <div className={`
          ${currentSize.image} bg-admin-bg-hover rounded-lg flex-shrink-0
        `} />
      )}

      {/* Content Skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-admin-bg-hover rounded w-3/4"></div>
        <div className="h-3 bg-admin-bg-hover rounded w-1/2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-admin-bg-hover rounded w-16"></div>
          <div className="h-3 bg-admin-bg-hover rounded w-20"></div>
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center space-x-1">
        <div className="w-6 h-6 bg-admin-bg-hover rounded-full"></div>
        <div className="w-6 h-4 bg-admin-bg-hover rounded"></div>
        <div className="w-6 h-6 bg-admin-bg-hover rounded-full"></div>
        <div className="w-6 h-6 bg-admin-bg-hover rounded-full ml-1"></div>
      </div>
    </div>
  );
}