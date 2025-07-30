'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

interface UseVirtualScrollingOptions {
  itemCount: number;
  itemSize: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  scrollingDelay?: number; // Delay before stopping scroll state
  getScrollElement?: () => HTMLElement | null;
  horizontal?: boolean;
  estimateSize?: (index: number) => number;
}

interface UseVirtualScrollingReturn {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToOffset: (offset: number) => void;
  isScrolling: boolean;
  startIndex: number;
  endIndex: number;
}

export function useVirtualScrolling(options: UseVirtualScrollingOptions): UseVirtualScrollingReturn {
  const {
    itemCount,
    itemSize,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
    getScrollElement,
    horizontal = false,
    estimateSize,
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [measuredCache, setMeasuredCache] = useState(new Map<number, number>());
  
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Get item size (supports both fixed and dynamic sizing)
  const getItemSize = useCallback((index: number): number => {
    if (typeof itemSize === 'function') {
      return itemSize(index);
    }
    return itemSize;
  }, [itemSize]);

  // Get item offset (cumulative size of all previous items)
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemSize === 'number') {
      return index * itemSize;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      const cachedSize = measuredCache.get(i);
      if (cachedSize !== undefined) {
        offset += cachedSize;
      } else {
        offset += estimateSize ? estimateSize(i) : getItemSize(i);
      }
    }
    return offset;
  }, [itemSize, measuredCache, estimateSize, getItemSize]);

  // Calculate total size of all items
  const totalSize = useMemo(() => {
    if (typeof itemSize === 'number') {
      return itemCount * itemSize;
    }

    let total = 0;
    for (let i = 0; i < itemCount; i++) {
      const cachedSize = measuredCache.get(i);
      if (cachedSize !== undefined) {
        total += cachedSize;
      } else {
        total += estimateSize ? estimateSize(i) : getItemSize(i);
      }
    }
    return total;
  }, [itemCount, itemSize, measuredCache, estimateSize, getItemSize]);

  // Binary search to find start index based on scroll offset
  const findStartIndex = useCallback((scrollOffset: number): number => {
    if (typeof itemSize === 'number') {
      return Math.floor(scrollOffset / itemSize);
    }

    let left = 0;
    let right = itemCount - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const offset = getItemOffset(mid);

      if (offset === scrollOffset) {
        return mid;
      } else if (offset < scrollOffset) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return Math.max(0, Math.min(itemCount - 1, right));
  }, [itemSize, itemCount, getItemOffset]);

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, findStartIndex(scrollOffset) - overscan);
    let end = start;

    if (typeof itemSize === 'number') {
      const visibleItemCount = Math.ceil(containerHeight / itemSize);
      end = Math.min(itemCount - 1, start + visibleItemCount + overscan * 2);
    } else {
      let currentOffset = getItemOffset(start);
      while (end < itemCount - 1 && currentOffset < scrollOffset + containerHeight + overscan * 50) {
        end++;
        const cachedSize = measuredCache.get(end);
        currentOffset += cachedSize !== undefined ? cachedSize : getItemSize(end);
      }
      end = Math.min(itemCount - 1, end + overscan);
    }

    return { startIndex: start, endIndex: end };
  }, [
    scrollOffset,
    containerHeight,
    itemCount,
    itemSize,
    overscan,
    findStartIndex,
    getItemOffset,
    measuredCache,
    getItemSize,
  ]);

  // Generate virtual items for the visible range
  const virtualItems: VirtualItem[] = useMemo(() => {
    const items: VirtualItem[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      const start = getItemOffset(i);
      const size = getItemSize(i);
      const end = start + size;

      items.push({
        index: i,
        start,
        end,
        size,
      });
    }

    return items;
  }, [startIndex, endIndex, getItemOffset, getItemSize]);

  // Scroll to specific index
  const scrollToIndex = useCallback((
    index: number,
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ) => {
    const element = scrollElementRef.current || (getScrollElement && getScrollElement());
    if (!element) return;

    const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
    const itemOffset = getItemOffset(clampedIndex);
    const itemSize = getItemSize(clampedIndex);

    let scrollTo = itemOffset;

    if (align === 'center') {
      scrollTo = itemOffset - (containerHeight - itemSize) / 2;
    } else if (align === 'end') {
      scrollTo = itemOffset - containerHeight + itemSize;
    } else if (align === 'auto') {
      if (itemOffset < scrollOffset) {
        scrollTo = itemOffset;
      } else if (itemOffset + itemSize > scrollOffset + containerHeight) {
        scrollTo = itemOffset - containerHeight + itemSize;
      } else {
        return; // Item is already visible
      }
    }

    scrollTo = Math.max(0, Math.min(totalSize - containerHeight, scrollTo));

    if (horizontal) {
      element.scrollLeft = scrollTo;
    } else {
      element.scrollTop = scrollTo;
    }
  }, [
    itemCount,
    containerHeight,
    scrollOffset,
    totalSize,
    horizontal,
    getScrollElement,
    getItemOffset,
    getItemSize,
  ]);

  // Scroll to specific offset
  const scrollToOffset = useCallback((offset: number) => {
    const element = scrollElementRef.current || (getScrollElement && getScrollElement());
    if (!element) return;

    const clampedOffset = Math.max(0, Math.min(totalSize - containerHeight, offset));

    if (horizontal) {
      element.scrollLeft = clampedOffset;
    } else {
      element.scrollTop = clampedOffset;
    }
  }, [totalSize, containerHeight, horizontal, getScrollElement]);

  // Handle scroll events
  const handleScroll = useCallback((event: Event) => {
    const element = event.target as HTMLElement;
    const newScrollOffset = horizontal ? element.scrollLeft : element.scrollTop;

    setScrollOffset(newScrollOffset);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }

    // Set new timeout to stop scrolling state
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [horizontal, scrollingDelay]);

  // Set up scroll listener
  useEffect(() => {
    const element = getScrollElement ? getScrollElement() : scrollElementRef.current;
    if (!element) return;

    scrollElementRef.current = element;
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [handleScroll, getScrollElement]);

  // Update measured cache for dynamic sizing
  const measureItem = useCallback((index: number, size: number) => {
    setMeasuredCache(prev => {
      if (prev.get(index) !== size) {
        const newCache = new Map(prev);
        newCache.set(index, size);
        return newCache;
      }
      return prev;
    });
  }, []);

  // Expose measure function for dynamic sizing
  useEffect(() => {
    if (typeof itemSize === 'function') {
      // For dynamic sizing, expose a measure function
      (window as any).__virtualScrollMeasure = measureItem;
    }

    return () => {
      if ((window as any).__virtualScrollMeasure) {
        delete (window as any).__virtualScrollMeasure;
      }
    };
  }, [measureItem, itemSize]);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    isScrolling,
    startIndex,
    endIndex,
  };
}