import React from 'react';

import { useDragScroll } from '@/hooks/useDragScroll';

interface DragScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'both' | 'vertical' | 'horizontal';
  sensitivity?: number;
  disabled?: boolean;
}

export default function DragScrollContainer({
  children,
  className = '',
  direction = 'vertical',
  sensitivity = 1,
  disabled = false
}: DragScrollContainerProps) {
  const { dragScrollRef, isDragging } = useDragScroll({
    direction,
    sensitivity,
    disabled
  });

  return (
    <div
      ref={dragScrollRef as React.RefObject<HTMLDivElement>}
      className={`drag-scroll-container ${className} ${isDragging ? 'dragging' : ''}`}
    >
      {children}
    </div>
  );
}