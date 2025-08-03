/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage?: number;
  fps?: number;
  scrollPerformance?: ScrollPerformanceMetrics;
}

export interface ScrollPerformanceMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  jankCount: number;
  totalFrames: number;
  droppedFrames: number;
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private rafId: number | null = null;
  private isMonitoring = false;
  private startTime = 0;

  start(): void {
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.setupObservers();
    this.startFPSMonitoring();
  }

  stop(): PerformanceMetrics {
    this.isMonitoring = false;
    this.cleanup();
    return this.getMetrics();
  }

  private setupObservers(): void {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
              this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (_e) {

      }

      // Monitor largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('largestContentfulPaint', entry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (_e) {

      }

      // Monitor cumulative layout shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              this.recordMetric('cumulativeLayoutShift', (entry as any).value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (_e) {

      }
    }
  }

  private startFPSMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    const frameTimes: number[] = [];

    const measureFrame = (currentTime: number) => {
      if (!this.isMonitoring) return;

      frameCount++;
      const deltaTime = currentTime - lastTime;
      frameTimes.push(deltaTime);

      // Calculate FPS every second
      if (frameCount % 60 === 0) {
        const avgFrameTime = frameTimes.slice(-60).reduce((a, b) => a + b, 0) / 60;
        const fps = 1000 / avgFrameTime;
        this.recordMetric('fps', fps);
      }

      lastTime = currentTime;
      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  private getMetrics(): PerformanceMetrics {
    const getAverage = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const getMin = (values: number[]) => Math.min(..._values);
    const getMax = (values: number[]) => Math.max(..._values);

    const fpsValues = this.metrics.get('fps') || [];
    const renderTimes = this.metrics.get('renderTime') || [0];
    const loadTimes = this.metrics.get('loadComplete') || [0];

    return {
      renderTime: getAverage(renderTimes),
      loadTime: getAverage(loadTimes),
      memoryUsage: this.getMemoryUsage(),
      fps: fpsValues.length > 0 ? getAverage(fpsValues) : undefined,
      scrollPerformance: fpsValues.length > 0 ? {
        averageFPS: getAverage(fpsValues),
        minFPS: getMin(fpsValues),
        maxFPS: getMax(fpsValues),
        jankCount: fpsValues.filter(fps => fps < 55).length,
        totalFrames: fpsValues.length,
        droppedFrames: fpsValues.filter(fps => fps < 30).length,
      } : undefined,
    };
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  private cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Memoization utilities
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  getKey?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = getKey ? getKey(..._args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(..._args);
    cache.set(key, result);
    return result;
  };
}

// Debounced function with performance tracking
export function createPerformantDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } {
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisBinding = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisBinding, args);
    return result;
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): ReturnType<T> | undefined {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
    return undefined;
  }

  function trailingEdge(time: number): ReturnType<T> {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = maxTimeoutId = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as any;
}

// Performance-optimized throttle
export function createPerformantThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;

  const { leading = true, trailing = true } = options;

  function throttled(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;

    lastArgs = args;
    lastThis = this;

    if (timeSinceLastExec >= delay) {
      if (leading || lastExecTime !== 0) {
        lastExecTime = currentTime;
        return func.apply(this, args);
      }
    } else if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        if (trailing && lastArgs) {
          lastExecTime = Date.now();
          func.apply(lastThis, lastArgs);
        }
        timeoutId = null;
      }, delay - timeSinceLastExec);
    }

    return undefined;
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastExecTime = 0;
    lastArgs = lastThis = undefined;
  };

  return throttled as any;
}

// Intersection Observer with performance optimizations
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit & {
    performanceThrottle?: boolean;
    throttleDelay?: number;
  } = {}
): IntersectionObserver {
  const {
    performanceThrottle = true,
    throttleDelay = 16, // ~60fps
    ...observerOptions
  } = options;

  const optimizedCallback = performanceThrottle
    ? createPerformantThrottle(callback, throttleDelay)
    : callback;

  return new IntersectionObserver(optimizedCallback, {
    threshold: 0.1,
    rootMargin: '50px',
    ...observerOptions,
  });
}

// Image loading performance optimization
export class ImageLoadOptimizer {
  private loadedImages = new Set<string>();
  private loadingImages = new Map<string, Promise<HTMLImageElement>>();

  async loadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<HTMLImageElement> {
    if (this.loadedImages.has(src)) {
      const img = new Image();
      img.src = src;
      return img;
    }

    if (this.loadingImages.has(src)) {
      return this.loadingImages.get(src)!;
    }

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      if (priority === 'high') {
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }

      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingImages.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingImages.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.loadingImages.set(src, loadPromise);
    return loadPromise;
  }

  preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => this.loadImage(url, 'low')));
  }

  isLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }

  isLoading(src: string): boolean {
    return this.loadingImages.has(src);
  }

  clearCache(): void {
    this.loadedImages.clear();
    this.loadingImages.clear();
  }
}

// Memory leak prevention utilities
export class MemoryLeakPrevention {
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timer>();
  private static observers = new Set<IntersectionObserver | MutationObserver | PerformanceObserver>();
  private static eventListeners = new Map<Element, Array<{ event: string; handler: EventListener }>>();

  static setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(timerId);
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }

  static setInterval(callback: () => void, delay: number): NodeJS.Timer {
    const intervalId = setInterval(callback, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  static clearTimeout(timerId: NodeJS.Timeout): void {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  static clearInterval(intervalId: NodeJS.Timer): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  static addObserver(observer: IntersectionObserver | MutationObserver | PerformanceObserver): void {
    this.observers.add(observer);
  }

  static removeObserver(observer: IntersectionObserver | MutationObserver | PerformanceObserver): void {
    observer.disconnect();
    this.observers.delete(observer);
  }

  static addEventListener(
    element: Element,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element)!.push({ event, handler });
  }

  static removeEventListener(element: Element, event: string, handler: EventListener): void {
    element.removeEventListener(event, handler);
    
    const listeners = this.eventListeners.get(element);
    if (listeners) {
      const index = listeners.findIndex(l => l.event === event && l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        this.eventListeners.delete(element);
      }
    }
  }

  static cleanup(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }
}

// Performance budget monitoring
export interface PerformanceBudget {
  renderTime: number; // ms
  loadTime: number; // ms
  memoryUsage: number; // MB
  fps: number;
  bundleSize: number; // KB
}

export class PerformanceBudgetMonitor {
  constructor(private budget: PerformanceBudget) {}

  check(metrics: PerformanceMetrics): {
    passed: boolean;
    violations: string[];
    score: number;
  } {
    const violations: string[] = [];
    let score = 100;

    if (metrics.renderTime > this.budget.renderTime) {
      violations.push(`Render time exceeded: ${metrics.renderTime}ms > ${this.budget.renderTime}ms`);
      score -= 20;
    }

    if (metrics.loadTime > this.budget.loadTime) {
      violations.push(`Load time exceeded: ${metrics.loadTime}ms > ${this.budget.loadTime}ms`);
      score -= 20;
    }

    if (metrics.memoryUsage && metrics.memoryUsage > this.budget.memoryUsage) {
      violations.push(`Memory usage exceeded: ${metrics.memoryUsage}MB > ${this.budget.memoryUsage}MB`);
      score -= 15;
    }

    if (metrics.fps && metrics.fps < this.budget.fps) {
      violations.push(`FPS below target: ${metrics.fps} < ${this.budget.fps}`);
      score -= 25;
    }

    return {
      passed: violations.length === 0,
      violations,
      score: Math.max(0, score),
    };
  }
}