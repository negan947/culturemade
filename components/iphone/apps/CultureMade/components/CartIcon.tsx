/**
 * CartIcon Component - Shopping bag icon with animated item count badge
 * Used in CultureMade app navigation with real-time cart updates
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import React, { useEffect } from 'react';

import { useCartCount } from '@/hooks/useCart';
import { getCartSessionId } from '@/utils/cartSync';

interface CartIconProps {
  userId?: string;
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: () => void;
}

export function CartIcon({
  userId,
  className = '',
  iconClassName = '',
  badgeClassName = '',
  size = 'md',
  showBadge = true,
  onClick
}: CartIconProps) {
  const sessionId = !userId ? getCartSessionId() : undefined;
  const { itemCount, isLoading, refreshCount } = useCartCount(userId, sessionId);

  // Refresh count periodically to keep in sync
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshCount]);

  // Listen for cart updates and refresh count immediately
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    // Pulse badge on custom event
    const handlePulse = () => {
      try {
        const el = document.getElementById('cart-icon-badge');
        if (el) {
          el.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(1)' }
          ], { duration: 250, easing: 'ease-out' });
        }
      } catch {}
    };
    window.addEventListener('cartBadgePulse', handlePulse);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('cartBadgePulse', handlePulse);
    };
  }, [refreshCount]);

  const sizeClasses = {
    sm: {
      icon: 'h-5 w-5',
      badge: 'h-4 w-4 text-xs min-w-[16px]',
      position: '-top-1 -right-1'
    },
    md: {
      icon: 'h-6 w-6',
      badge: 'h-5 w-5 text-xs min-w-[20px]',
      position: '-top-2 -right-2'
    },
    lg: {
      icon: 'h-7 w-7',
      badge: 'h-6 w-6 text-sm min-w-[24px]',
      position: '-top-2 -right-2'
    }
  };

  const currentSize = sizeClasses[size];
  const displayCount = itemCount > 99 ? '99+' : itemCount.toString();

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      {/* Cart Icon */}
      <ShoppingBag 
        className={`${currentSize.icon} ${iconClassName}`}
      />

      {/* Item Count Badge */}
      <AnimatePresence>
        {showBadge && itemCount > 0 && !isLoading && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 30,
              duration: 0.2 
            }}
            id="cart-icon-badge"
            className={`
              absolute ${currentSize.position} 
              ${currentSize.badge}
              bg-red-500 text-white rounded-full
              flex items-center justify-center
              font-bold leading-none
              ring-2 ring-white
              ${badgeClassName}
            `}
          >
            {displayCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      {isLoading && showBadge && (
        <div 
          className={`
            absolute ${currentSize.position}
            ${currentSize.badge}
            bg-gray-300 rounded-full
            flex items-center justify-center
            animate-pulse
          `}
        >
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Pulse Animation for New Items */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0, 0.3, 0] 
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
            className={`
              absolute inset-0 
              ${currentSize.icon}
              bg-admin-accent rounded-full
              pointer-events-none
            `}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * CartIconBadge - Standalone cart badge for custom implementations
 */
interface CartIconBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxCount?: number;
}

export function CartIconBadge({ 
  count, 
  className = '', 
  size = 'md',
  maxCount = 99 
}: CartIconBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]'
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 30 
          }}
          className={`
            ${sizeClasses[size]}
            bg-red-500 text-white rounded-full
            flex items-center justify-center
            font-bold leading-none
            ring-2 ring-white
            ${className}
          `}
        >
          {displayCount}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * CartIconWithDropdown - Cart icon with quick preview dropdown
 */
interface CartIconWithDropdownProps extends CartIconProps {
  showDropdown?: boolean;
  onDropdownToggle?: () => void;
  dropdownContent?: React.ReactNode;
}

export function CartIconWithDropdown({
  showDropdown = false,
  onDropdownToggle,
  dropdownContent,
  ...cartIconProps
}: CartIconWithDropdownProps) {
  return (
    <div className="relative">
      <CartIcon
        {...cartIconProps}
        {...(onDropdownToggle && { onClick: onDropdownToggle })}
      />
      
      <AnimatePresence>
        {showDropdown && dropdownContent && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          >
            {dropdownContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}