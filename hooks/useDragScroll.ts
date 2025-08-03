import { useRef, useEffect, useState, useCallback } from 'react';

interface DragScrollOptions {
  direction?: 'both' | 'vertical' | 'horizontal';
  sensitivity?: number;
  smoothness?: number;
  disabled?: boolean;
}

interface DragScrollReturn {
  dragScrollRef: React.RefObject<HTMLElement | null>;
  isDragging: boolean;
}

export function useDragScroll({
  direction = 'vertical',
  sensitivity = 1,
  smoothness = 0.1,
  disabled = false
}: DragScrollOptions = {}): DragScrollReturn {
  const dragScrollRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    momentum: { x: 0, y: 0 },
    lastX: 0,
    lastY: 0,
    animationId: 0
  });

  const applyMomentum = useCallback(() => {
    const element = dragScrollRef.current;
    if (!element || !dragState.current.momentum.x && !dragState.current.momentum.y) {
      return;
    }

    // Apply momentum scrolling
    if (direction === 'both' || direction === 'horizontal') {
      element.scrollLeft += dragState.current.momentum.x;
      dragState.current.momentum.x *= 0.95; // Friction
    }
    
    if (direction === 'both' || direction === 'vertical') {
      element.scrollTop += dragState.current.momentum.y;
      dragState.current.momentum.y *= 0.95; // Friction
    }

    // Continue animation if momentum is significant
    if (Math.abs(dragState.current.momentum.x) > 0.5 || Math.abs(dragState.current.momentum.y) > 0.5) {
      dragState.current.animationId = requestAnimationFrame(applyMomentum);
    }
  }, [direction]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (disabled) return;
    
    const element = dragScrollRef.current;
    if (!element) return;

    // Only start drag on left mouse button
    if (e.button !== 0) return;

    // Don't start drag on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')) {
      return;
    }

    e.preventDefault();
    
    dragState.current = {
      isDragging: true,
      startX: e.pageX,
      startY: e.pageY,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
      momentum: { x: 0, y: 0 },
      lastX: e.pageX,
      lastY: e.pageY,
      animationId: 0
    };

    setIsDragging(true);
    element.style.cursor = 'grabbing';
    element.style.userSelect = 'none';

    // Cancel any ongoing momentum animation
    if (dragState.current.animationId) {
      cancelAnimationFrame(dragState.current.animationId);
    }
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging) return;
    
    const element = dragScrollRef.current;
    if (!element) return;

    e.preventDefault();

    const deltaX = (e.pageX - dragState.current.startX) * sensitivity;
    const deltaY = (e.pageY - dragState.current.startY) * sensitivity;

    // Calculate momentum for smooth scrolling after release
    dragState.current.momentum.x = (dragState.current.lastX - e.pageX) * 0.5;
    dragState.current.momentum.y = (dragState.current.lastY - e.pageY) * 0.5;
    
    dragState.current.lastX = e.pageX;
    dragState.current.lastY = e.pageY;

    // Apply scrolling based on direction
    if (direction === 'both' || direction === 'horizontal') {
      element.scrollLeft = dragState.current.scrollLeft - deltaX;
    }
    
    if (direction === 'both' || direction === 'vertical') {
      element.scrollTop = dragState.current.scrollTop - deltaY;
    }
  }, [sensitivity, direction]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.isDragging) return;

    const element = dragScrollRef.current;
    if (!element) return;

    dragState.current.isDragging = false;
    setIsDragging(false);
    element.style.cursor = '';
    element.style.userSelect = '';

    // Start momentum scrolling
    applyMomentum();
  }, [applyMomentum]);

  const handleMouseLeave = useCallback(() => {
    // Stop dragging when mouse leaves the element
    if (dragState.current.isDragging) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const element = dragScrollRef.current;
    if (!element) return;

    // Don't start drag on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;
    
    dragState.current = {
      isDragging: true,
      startX: touch.pageX,
      startY: touch.pageY,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
      momentum: { x: 0, y: 0 },
      lastX: touch.pageX,
      lastY: touch.pageY,
      animationId: 0
    };

    setIsDragging(true);
    element.style.cursor = 'grabbing';
    element.style.userSelect = 'none';

    // Cancel any ongoing momentum animation
    if (dragState.current.animationId) {
      cancelAnimationFrame(dragState.current.animationId);
    }
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.current.isDragging) return;
    
    const element = dragScrollRef.current;
    if (!element) return;

    e.preventDefault();

    const touch = e.touches[0];
    if (!touch) return;
    
    const deltaX = (touch.pageX - dragState.current.startX) * sensitivity;
    const deltaY = (touch.pageY - dragState.current.startY) * sensitivity;

    // Calculate momentum for smooth scrolling after release
    dragState.current.momentum.x = (dragState.current.lastX - touch.pageX) * 0.5;
    dragState.current.momentum.y = (dragState.current.lastY - touch.pageY) * 0.5;
    
    dragState.current.lastX = touch.pageX;
    dragState.current.lastY = touch.pageY;

    // Apply scrolling based on direction
    if (direction === 'both' || direction === 'horizontal') {
      element.scrollLeft = dragState.current.scrollLeft - deltaX;
    }
    
    if (direction === 'both' || direction === 'vertical') {
      element.scrollTop = dragState.current.scrollTop - deltaY;
    }
  }, [sensitivity, direction]);

  const handleTouchEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;

    const element = dragScrollRef.current;
    if (!element) return;

    dragState.current.isDragging = false;
    setIsDragging(false);
    element.style.cursor = '';
    element.style.userSelect = '';

    // Start momentum scrolling
    applyMomentum();
  }, [applyMomentum]);

  useEffect(() => {
    const element = dragScrollRef.current;
    if (!element || disabled) return;

    // Add mouse event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Add touch event listeners for mobile
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Set initial cursor
    element.style.cursor = 'grab';

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);  
      document.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      // Remove touch event listeners
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // Cancel any ongoing momentum animation
      if (dragState.current.animationId) {
        cancelAnimationFrame(dragState.current.animationId);
      }
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    dragScrollRef,
    isDragging
  };
}