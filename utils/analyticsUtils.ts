/**
 * Analytics Utilities for CultureMade ProductCard System
 * 
 * Provides comprehensive product interaction tracking and analytics
 * integration for click handling, impression tracking, and user behavior analysis.
 */

// =============================================================================
// ANALYTICS INTERFACES
// =============================================================================

export interface ProductInteractionEvent {
  product_id: string;
  event_type: 'impression' | 'click' | 'add_to_cart' | 'view_detail' | 'share' | 'wishlist';
  event_data: Record<string, any>;
  user_session: string;
  timestamp: string;
  source_component: string;        // 'product_grid', 'search_results', 'recommendations'
  position_index?: number | undefined;         // Position in grid/list for impression tracking
  search_query?: string | undefined;           // If from search results
  category_id?: string | undefined;            // If from category browsing
}

export interface AnalyticsConfig {
  enableTracking: boolean;         // Global tracking toggle
  enableImpressions: boolean;      // Track product impressions
  enableClicks: boolean;           // Track product clicks
  sessionDuration: number;         // Session duration in minutes (default: 30)
  batchSize: number;              // Number of events to batch before sending (default: 10)
  flushInterval: number;          // Interval to flush batched events in ms (default: 30000)
  enableDebugLogging: boolean;    // Log analytics events to console
}

export interface InteractionMetrics {
  impressions: number;
  clicks: number;
  clickThroughRate: number;       // clicks / impressions * 100
  avgTimeToClick: number;         // average ms from impression to click
  bounceRate: number;             // impressions without clicks / total impressions
  conversionEvents: number;       // add_to_cart, view_detail events
}

export interface UserSession {
  sessionId: string;
  userId?: string;                // If authenticated
  startTime: number;
  lastActivity: number;
  events: ProductInteractionEvent[];
  isActive: boolean;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Generate or retrieve current user session ID
 * Manages session persistence and expiration
 */
export function getCurrentSession(): UserSession {
  const SESSION_KEY = 'culturemade_analytics_session';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session: UserSession = JSON.parse(stored);
      const now = Date.now();
      
      // Check if session is still active
      if (now - session.lastActivity < SESSION_DURATION) {
        session.lastActivity = now;
        session.isActive = true;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
    }
  } catch (_error) {

  }
  
  // Create new session
  const newSession: UserSession = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    events: [],
    isActive: true
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  } catch (_error) {

  }
  
  return newSession;
}

/**
 * Generate unique session ID
 * Creates cryptographically secure session identifier
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Update session with user ID when user logs in
 * Links anonymous session to authenticated user
 */
export function updateSessionUserId(userId: string): void {
  const session = getCurrentSession();
  session.userId = userId;
  session.lastActivity = Date.now();
  
  try {
    localStorage.setItem('culturemade_analytics_session', JSON.stringify(session));
  } catch (_error) {

  }
}

// =============================================================================
// EVENT TRACKING UTILITIES
// =============================================================================

/**
 * Track product impression event
 * Records when product is visible to user
 */
export function trackProductImpression(
  productId: string,
  sourceComponent: string,
  options: {
    positionIndex?: number;
    searchQuery?: string;
    categoryId?: string;
    additionalData?: Record<string, any>;
  } = {}
): void {
  const event: ProductInteractionEvent = {
    product_id: productId,
    event_type: 'impression',
    event_data: {
      viewport_visible: true,
      ...options.additionalData
    },
    user_session: getCurrentSession().sessionId,
    timestamp: new Date().toISOString(),
    source_component: sourceComponent,
    ...(options.positionIndex !== undefined ? { position_index: options.positionIndex } : {}),
    ...(options.searchQuery !== undefined ? { search_query: options.searchQuery } : {}),
    ...(options.categoryId !== undefined ? { category_id: options.categoryId } : {})
  };
  
  queueAnalyticsEvent(event);
}

/**
 * Track product click event
 * Records when user clicks on product card
 */
export function trackProductClick(
  productId: string,
  sourceComponent: string,
  options: {
    positionIndex?: number;
    searchQuery?: string;
    categoryId?: string;
    clickTarget?: string; // 'image', 'title', 'price', 'badge'
    additionalData?: Record<string, any>;
  } = {}
): void {
  const event: ProductInteractionEvent = {
    product_id: productId,
    event_type: 'click',
    event_data: {
      click_target: options.clickTarget || 'card',
      ...options.additionalData
    },
    user_session: getCurrentSession().sessionId,
    timestamp: new Date().toISOString(),
    source_component: sourceComponent,
    ...(options.positionIndex !== undefined ? { position_index: options.positionIndex } : {}),
    ...(options.searchQuery ? { search_query: options.searchQuery } : {}),
    ...(options.categoryId ? { category_id: options.categoryId } : {})
  };
  
  queueAnalyticsEvent(event);
}

/**
 * Track product detail view event
 * Records when user opens product detail modal/page
 */
export function trackProductDetailView(
  productId: string,
  sourceComponent: string,
  options: {
    searchQuery?: string;
    categoryId?: string;
    referrer?: string;
    additionalData?: Record<string, any>;
  } = {}
): void {
  const event: ProductInteractionEvent = {
    product_id: productId,
    event_type: 'view_detail',
    event_data: {
      referrer: options.referrer || document.referrer,
      ...options.additionalData
    },
    user_session: getCurrentSession().sessionId,
    timestamp: new Date().toISOString(),
    source_component: sourceComponent,
    ...(options.searchQuery ? { search_query: options.searchQuery } : {}),
    ...(options.categoryId ? { category_id: options.categoryId } : {})
  };
  
  queueAnalyticsEvent(event);
}

/**
 * Track add to cart event
 * Records when user adds product to shopping cart
 */
export function trackAddToCart(
  productId: string,
  sourceComponent: string,
  options: {
    variantId?: string;
    quantity?: number;
    price?: number;
    searchQuery?: string;
    categoryId?: string;
    additionalData?: Record<string, any>;
  } = {}
): void {
  const event: ProductInteractionEvent = {
    product_id: productId,
    event_type: 'add_to_cart',
    event_data: {
      variant_id: options.variantId,
      quantity: options.quantity || 1,
      price: options.price,
      ...options.additionalData
    },
    user_session: getCurrentSession().sessionId,
    timestamp: new Date().toISOString(),
    source_component: sourceComponent,
    ...(options.searchQuery ? { search_query: options.searchQuery } : {}),
    ...(options.categoryId ? { category_id: options.categoryId } : {})
  };
  
  queueAnalyticsEvent(event);
}

// =============================================================================
// EVENT BATCHING AND PERSISTENCE
// =============================================================================

let eventQueue: ProductInteractionEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

const defaultConfig: AnalyticsConfig = {
  enableTracking: true,
  enableImpressions: true,
  enableClicks: true,
  sessionDuration: 30,
  batchSize: 10,
  flushInterval: 30000,
  enableDebugLogging: false
};

/**
 * Queue analytics event for batched processing
 * Automatically flushes when batch size is reached
 */
export function queueAnalyticsEvent(event: ProductInteractionEvent): void {
  const config = getAnalyticsConfig();
  
  if (!config.enableTracking) return;
  
  if (config.enableDebugLogging) {

  }
  
  eventQueue.push(event);
  
  // Flush immediately if batch size reached
  if (eventQueue.length >= config.batchSize) {
    flushAnalyticsEvents();
  } else {
    // Schedule flush if not already scheduled
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushAnalyticsEvents();
      }, config.flushInterval);
    }
  }
}

/**
 * Flush queued analytics events to server
 * Sends batched events to analytics API endpoint
 */
export async function flushAnalyticsEvents(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  try {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: eventsToSend,
        session_id: getCurrentSession().sessionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
    
    const config = getAnalyticsConfig();
    if (config.enableDebugLogging) {

    }
  } catch (_error) {

    
    // Re-queue events for retry (with limit to prevent infinite growth)
    if (eventQueue.length < 100) {
      eventQueue.unshift(...(arguments[0] as any));
    }
  }
}

/**
 * Get current analytics configuration
 * Merges default config with stored preferences
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  try {
    const stored = localStorage.getItem('culturemade_analytics_config');
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (_error) {

  }
  
  return defaultConfig;
}

/**
 * Update analytics configuration
 * Saves configuration to localStorage for persistence
 */
export function updateAnalyticsConfig(newConfig: Partial<AnalyticsConfig>): void {
  const currentConfig = getAnalyticsConfig();
  const updatedConfig = { ...currentConfig, ...newConfig };
  
  try {
    localStorage.setItem('culturemade_analytics_config', JSON.stringify(updatedConfig));
  } catch (_error) {

  }
}

// =============================================================================
// ANALYTICS REPORTING UTILITIES
// =============================================================================

/**
 * Calculate interaction metrics for a product
 * Provides click-through rates and engagement metrics
 */
export function calculateInteractionMetrics(
  productId: string,
  events: ProductInteractionEvent[]
): InteractionMetrics {
  const productEvents = events.filter(e => e.product_id === productId);
  
  const impressions = productEvents.filter(e => e.event_type === 'impression').length;
  const clicks = productEvents.filter(e => e.event_type === 'click').length;
  const conversions = productEvents.filter(e => 
    ['add_to_cart', 'view_detail'].includes(e.event_type)
  ).length;
  
  const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const bounceRate = impressions > 0 ? ((impressions - clicks) / impressions) * 100 : 0;
  
  // Calculate average time to click (simplified)
  const avgTimeToClick = calculateAverageTimeToClick(productEvents);
  
  return {
    impressions,
    clicks,
    clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    avgTimeToClick,
    bounceRate: Math.round(bounceRate * 100) / 100,
    conversionEvents: conversions
  };
}

/**
 * Calculate average time from impression to click
 * Measures user engagement speed
 */
function calculateAverageTimeToClick(events: ProductInteractionEvent[]): number {
  const impressions = events.filter(e => e.event_type === 'impression');
  const clicks = events.filter(e => e.event_type === 'click');
  
  if (impressions.length === 0 || clicks.length === 0) return 0;
  
  let totalTime = 0;
  let validPairs = 0;
  
  for (const click of clicks) {
    const clickTime = new Date(click.timestamp).getTime();
    
    // Find the most recent impression before this click
    const recentImpression = impressions
      .filter(imp => new Date(imp.timestamp).getTime() < clickTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (recentImpression) {
      const impressionTime = new Date(recentImpression.timestamp).getTime();
      totalTime += clickTime - impressionTime;
      validPairs++;
    }
  }
  
  return validPairs > 0 ? totalTime / validPairs : 0;
}

// =============================================================================
// DEBOUNCING AND PERFORMANCE UTILITIES
// =============================================================================

/**
 * Debounce function for preventing rapid-fire events
 * Used to prevent double-clicks and spam events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for impression tracking
 * Limits impression events to prevent performance issues
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// =============================================================================
// CLEANUP AND LIFECYCLE MANAGEMENT
// =============================================================================

/**
 * Clean up analytics resources and flush remaining events
 * Should be called when component unmounts or page unloads
 */
export async function cleanupAnalytics(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  // Flush any remaining events
  await flushAnalyticsEvents();
}

/**
 * Initialize analytics system
 * Sets up event listeners and configuration
 */
export function initializeAnalytics(config?: Partial<AnalyticsConfig>): void {
  if (config) {
    updateAnalyticsConfig(config);
  }
  
  // Set up page unload handler to flush events
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable event delivery on page unload
      if (eventQueue.length > 0 && navigator.sendBeacon) {
        const eventsToSend = [...eventQueue];
        eventQueue = [];
        
        navigator.sendBeacon('/api/analytics/events', JSON.stringify({
          events: eventsToSend,
          session_id: getCurrentSession().sessionId
        }));
      }
    });
    
    // Periodic cleanup of old sessions
    setInterval(() => {
      try {
        const session = getCurrentSession();
        const now = Date.now();
        const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
        
        if (now - session.lastActivity > SESSION_DURATION) {
          localStorage.removeItem('culturemade_analytics_session');
        }
      } catch (_error) {
        // Ignore cleanup errors
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export const AnalyticsUtils = {
  // Session management
  getCurrentSession,
  updateSessionUserId,
  
  // Event tracking
  trackImpression: trackProductImpression,
  trackClick: trackProductClick,
  trackDetailView: trackProductDetailView,
  trackAddToCart,
  
  // Event management
  queueEvent: queueAnalyticsEvent,
  flushEvents: flushAnalyticsEvents,
  
  // Configuration
  getConfig: getAnalyticsConfig,
  updateConfig: updateAnalyticsConfig,
  
  // Metrics
  calculateMetrics: calculateInteractionMetrics,
  
  // Utilities
  debounce,
  throttle,
  
  // Lifecycle
  initialize: initializeAnalytics,
  cleanup: cleanupAnalytics,
} as const;

export default AnalyticsUtils;