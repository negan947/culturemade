'use client';

import { Package } from 'lucide-react';
import Image from 'next/image';

interface ProductPlaceholderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showIcon?: boolean;
  variant?: 'icon' | 'svg' | 'pattern';
}

const sizeClasses = {
  small: 'w-10 h-10',
  medium: 'w-20 h-20', 
  large: 'w-32 h-32'
};

const iconSizes = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12'
};

export default function ProductPlaceholder({ 
  size = 'medium',
  className = '',
  showIcon = true,
  variant = 'icon'
}: ProductPlaceholderProps) {
  
  if (variant === 'svg') {
    return (
      <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200`}>
        <Image
          src="/images/product-placeholder-icon.svg"
          alt="Product placeholder"
          fill
          className="object-contain p-1"
        />
      </div>
    );
  }

  if (variant === 'pattern') {
    return (
      <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
        <div className="absolute inset-0 bg-[url('/images/product-placeholder.svg')] bg-center bg-no-repeat bg-contain opacity-30" />
        {showIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}
      </div>
    );
  }

  // Default icon variant
  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center`}>
      {showIcon && <Package className={`${iconSizes[size]} text-gray-400`} />}
    </div>
  );
}