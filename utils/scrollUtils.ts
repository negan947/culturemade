/**
 * Scroll detection and throttling utilities for performance optimization
 */

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return function (this: any, ...args: Parameters<T>) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Debounce function for scroll events
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Request animation frame throttle for smooth animations
export function rafThrottle<T extends (...args: any[]) => void>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (rafId) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

// Get scroll position with cross-browser compatibility
export function getScrollPosition(element?: HTMLElement | null): { x: number; y: number } {
  if (element) {
    return {
      x: element.scrollLeft,
      y: element.scrollTop,
    };
  }

  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
  };
}

// Get element dimensions and position
export function getElementRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

// Check if element is in viewport
export function isElementInViewport(
  element: HTMLElement,
  threshold = 0,
  rootMargin = 0
): boolean {
  const rect = getElementRect(element);
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalThreshold = windowHeight * threshold;
  const horizontalThreshold = windowWidth * threshold;

  return (
    rect.top >= -rootMargin &&
    rect.left >= -rootMargin &&
    rect.bottom <= windowHeight + rootMargin + verticalThreshold &&
    rect.right <= windowWidth + rootMargin + horizontalThreshold
  );
}

// Get scroll percentage of an element
export function getScrollPercentage(element?: HTMLElement | null): number {
  let scrollTop: number;
  let scrollHeight: number;
  let clientHeight: number;

  if (element) {
    scrollTop = element.scrollTop;
    scrollHeight = element.scrollHeight;
    clientHeight = element.clientHeight;
  } else {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    clientHeight = window.innerHeight || document.documentElement.clientHeight;
  }

  const maxScroll = scrollHeight - clientHeight;
  return maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
}

// Smooth scroll to position
export function smoothScrollTo(
  target: number | HTMLElement,
  duration = 500,
  element?: HTMLElement | null
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const scrollElement = element || window;
    const isWindow = scrollElement === window;
    
    let startPosition: number;
    let targetPosition: number;

    if (typeof target === 'number') {
      startPosition = isWindow ? window.pageYOffset : (element as HTMLElement).scrollTop;
      targetPosition = target;
    } else {
      startPosition = isWindow ? window.pageYOffset : (element as HTMLElement).scrollTop;
      const targetRect = target.getBoundingClientRect();
      const containerRect = isWindow ? { top: 0 } : (element as HTMLElement).getBoundingClientRect();
      targetPosition = startPosition + targetRect.top - containerRect.top;
    }

    const distance = targetPosition - startPosition;

    function animateScroll(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentPosition = startPosition + distance * easeOutCubic;

      if (isWindow) {
        window.scrollTo(0, currentPosition);
      } else {
        (element as HTMLElement).scrollTop = currentPosition;
      }

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animateScroll);
  });
}

// Detect scroll direction
export interface ScrollDirection {
  vertical: 'up' | 'down' | 'none';
  horizontal: 'left' | 'right' | 'none';
}

export function createScrollDirectionDetector(
  threshold = 0
): (element?: HTMLElement | null) => ScrollDirection {
  let lastScrollX = 0;
  let lastScrollY = 0;

  return (element?: HTMLElement | null): ScrollDirection => {
    const { x: currentX, y: currentY } = getScrollPosition(element);
    
    const deltaX = currentX - lastScrollX;
    const deltaY = currentY - lastScrollY;

    const direction: ScrollDirection = {
      vertical: Math.abs(deltaY) > threshold 
        ? (deltaY > 0 ? 'down' : 'up') 
        : 'none',
      horizontal: Math.abs(deltaX) > threshold 
        ? (deltaX > 0 ? 'right' : 'left') 
        : 'none',
    };

    lastScrollX = currentX;
    lastScrollY = currentY;

    return direction;
  };
}

// Create intersection observer with performance optimizations
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  // Throttle the callback for better performance
  const throttledCallback = throttle(callback, 16); // ~60fps

  return new IntersectionObserver(throttledCallback, defaultOptions);
}

// Virtual scrolling utilities
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollParams(
  scrollTop: number,
  config: VirtualScrollConfig,
  itemCount: number
): {
  startIndex: number;
  endIndex: number;
  offsetY: number;
} {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleItemCount + overscan * 2);
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
}

// Performance monitoring for scroll events
export class ScrollPerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isMonitoring = false;

  start(): void {
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFPS();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  getFPS(): number {
    return this.fps;
  }

  private measureFPS(): void {
    if (!this.isMonitoring) return;

    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measureFPS());
  }
}

// Scroll position cache for better performance
export class ScrollPositionCache {
  private cache = new Map<string, { x: number; y: number; timestamp: number }>();
  private maxAge = 5000; // 5 seconds

  set(key: string, position: { x: number; y: number }): void {
    this.cache.set(key, {
      ...position,
      timestamp: Date.now(),
    });
  }

  get(key: string): { x: number; y: number } | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return { x: cached.x, y: cached.y };
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}