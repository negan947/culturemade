/**
 * Cart Synchronization Utilities
 * Handles guest cart merging, persistence, and session management
 */

import { v4 as uuidv4 } from 'uuid';

export interface CartSyncOptions {
  enableLocalStorage?: boolean;
  sessionTimeout?: number; // minutes
  mergeStrategy?: 'replace' | 'merge' | 'keep_existing';
}

const DEFAULT_OPTIONS: CartSyncOptions = {
  enableLocalStorage: true,
  sessionTimeout: 60 * 24, // 24 hours
  mergeStrategy: 'merge'
};

const STORAGE_KEYS = {
  SESSION_ID: 'cart_session_id',
  SESSION_EXPIRES: 'cart_session_expires',
  LAST_SYNC: 'cart_last_sync'
};

/**
 * Generate or retrieve cart session ID
 */
export function getCartSessionId(): string {
  if (typeof window === 'undefined') {
    return uuidv4(); // Server-side fallback
  }

  try {
    const existingId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);
    
    // Check if session is still valid
    if (existingId && expiresAt) {
      const expireTime = parseInt(expiresAt);
      if (Date.now() < expireTime) {
        return existingId;
      }
    }
    
    // Generate new session ID
    const newSessionId = uuidv4();
    const newExpireTime = Date.now() + (DEFAULT_OPTIONS.sessionTimeout! * 60 * 1000);
    
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, newExpireTime.toString());
    
    return newSessionId;
  } catch (error) {
    console.warn('Failed to access localStorage for cart session:', error);
    return uuidv4();
  }
}

/**
 * Clear cart session (e.g., on logout)
 */
export function clearCartSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.warn('Failed to clear cart session:', error);
  }
}

/**
 * Extend cart session expiration
 */
export function extendCartSession(): void {
  if (typeof window === 'undefined') return;

  try {
    const newExpireTime = Date.now() + (DEFAULT_OPTIONS.sessionTimeout! * 60 * 1000);
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, newExpireTime.toString());
  } catch (error) {
    console.warn('Failed to extend cart session:', error);
  }
}

/**
 * Check if cart session is valid
 */
export function isCartSessionValid(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);
    
    if (!sessionId || !expiresAt) return false;
    
    const expireTime = parseInt(expiresAt);
    return Date.now() < expireTime;
  } catch (error) {
    console.warn('Failed to check cart session validity:', error);
    return false;
  }
}

/**
 * Merge guest cart with user cart on login
 */
export async function mergeGuestCart(
  guestSessionId: string,
  userId: string,
  options: CartSyncOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Call API to merge carts
    const response = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestSessionId,
        userId,
        strategy: opts.mergeStrategy
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to merge cart');
    }

    const result = await response.json();
    
    // Clear guest session after successful merge
    clearCartSession();
    
    // Update last sync time
    if (opts.enableLocalStorage) {
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      } catch (error) {
        console.warn('Failed to update last sync time:', error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to merge guest cart:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync cart state between tabs/windows
 */
export function setupCartSync(
  onCartChange: (event: StorageEvent) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for server-side
  }

  const handleStorageChange = (event: StorageEvent) => {
    // Only handle cart-related storage changes
    if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
      onCartChange(event);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Backup cart data to localStorage (for offline support)
 */
export function backupCartData(
  items: any[],
  summary: any,
  options: CartSyncOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!opts.enableLocalStorage || typeof window === 'undefined') return;

  try {
    const backup = {
      items,
      summary,
      timestamp: Date.now(),
      version: '1.0'
    };

    localStorage.setItem('cart_backup', JSON.stringify(backup));
  } catch (error) {
    console.warn('Failed to backup cart data:', error);
  }
}

/**
 * Restore cart data from localStorage
 */
export function restoreCartData(): {
  items: any[];
  summary: any;
  timestamp: number;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const backupData = localStorage.getItem('cart_backup');
    if (!backupData) return null;

    const backup = JSON.parse(backupData);
    
    // Check if backup is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - backup.timestamp > maxAge) {
      localStorage.removeItem('cart_backup');
      return null;
    }

    return {
      items: backup.items || [],
      summary: backup.summary || null,
      timestamp: backup.timestamp
    };
  } catch (error) {
    console.warn('Failed to restore cart data:', error);
    return null;
  }
}

/**
 * Clear cart backup data
 */
export function clearCartBackup(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('cart_backup');
  } catch (error) {
    console.warn('Failed to clear cart backup:', error);
  }
}

/**
 * Get cart identification for current user/session
 */
export function getCartIdentification(userId?: string): {
  userId?: string;
  sessionId?: string;
} {
  if (userId) {
    return { userId };
  }
  
  return { sessionId: getCartSessionId() };
}

/**
 * Handle cart migration from session to user
 */
export async function handleCartMigration(
  oldSessionId: string,
  newUserId: string
): Promise<boolean> {
  try {
    const result = await mergeGuestCart(oldSessionId, newUserId);
    if (result.success) {
      // Clear old session data
      clearCartSession();
      clearCartBackup();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Cart migration failed:', error);
    return false;
  }
}

/**
 * Validate cart session and refresh if needed
 */
export function validateAndRefreshSession(): string {
  if (!isCartSessionValid()) {
    clearCartSession();
    return getCartSessionId();
  }
  
  extendCartSession();
  return getCartSessionId();
}

/**
 * Cart sync manager class for advanced usage
 */
export class CartSyncManager {
  private options: CartSyncOptions;
  private cleanup?: () => void;

  constructor(options: CartSyncOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  init(onCartChange: (event: StorageEvent) => void): void {
    this.cleanup = setupCartSync(onCartChange);
  }

  destroy(): void {
    if (this.cleanup) {
      this.cleanup();
    }
  }

  getSessionId(): string {
    return getCartSessionId();
  }

  async mergeCart(guestSessionId: string, userId: string): Promise<boolean> {
    const result = await mergeGuestCart(guestSessionId, userId, this.options);
    return result.success;
  }

  backupCart(items: any[], summary: any): void {
    backupCartData(items, summary, this.options);
  }

  restoreCart(): any {
    return restoreCartData();
  }

  clearSession(): void {
    clearCartSession();
    clearCartBackup();
  }
}