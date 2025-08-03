'use client';

import { motion } from 'framer-motion';
import { FC, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/store';

interface Props {
  // eslint-disable-next-line no-unused-vars
  handleHomeBar: (_offsetX: number, _offsetY: number) => void;
  // eslint-disable-next-line no-unused-vars
  handleDragEnd: (_finalOffset: number) => void;
}

const HomeBar: FC<Props> = ({ handleHomeBar, handleDragEnd }) => {
  const color = useSelector(
    (state: RootState) => state.interface.statusBarColor
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const homeBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enhanced mobile detection using feature detection
    const checkMobile = () => {
      // Feature-based detection instead of user-agent sniffing
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileViewport = window.innerWidth <= 768;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      
      return hasTouch && (isMobileViewport || hasCoarsePointer);
    };
    
    setIsMobile(checkMobile());
    
    // Re-check on resize for better responsive behavior
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Native touch event handlers for mobile (fallback for Framer Motion bugs)
  useEffect(() => {
    if (!isMobile || !homeBarRef.current) return;

    const element = homeBarRef.current;
    let startPoint: { x: number; y: number } | null = null;
    let isNativeCapturing = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      startPoint = { x: touch.clientX, y: touch.clientY };
      
      // Only capture if starting from bottom area
      const distanceFromBottom = window.innerHeight - touch.clientY;
      if (distanceFromBottom <= 25) {
        isNativeCapturing = true;
        e.preventDefault(); // Prevent iOS Safari interference
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isNativeCapturing || !startPoint) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const offsetX = touch.clientX - startPoint.x;
      const offsetY = touch.clientY - startPoint.y;
      
      handleHomeBar(offsetX, offsetY);
      e.preventDefault(); // Prevent scrolling
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isNativeCapturing || !startPoint) return;
      
      const touch = e.changedTouches[0];
      if (!touch) return;
      
      const offsetY = touch.clientY - startPoint.y;
      
      handleDragEnd(offsetY);
      isNativeCapturing = false;
      startPoint = null;
      e.preventDefault();
    };

    // Add event listeners with passive: false for preventDefault to work
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleHomeBar, handleDragEnd]);

  return (
    <motion.div
      ref={homeBarRef}
      // Use Framer Motion for desktop, native events handle mobile
      {...(!isMobile && {
        onPanStart: (_e, info) => {
          startPointRef.current = { x: info.point.x, y: info.point.y };
          setIsCapturing(true);
        },
        onPan: (_e, info) => {
          if (isCapturing) {
            handleHomeBar(info.offset.x, info.offset.y);
          }
        },
        onPanEnd: (_e, info) => {
          if (isCapturing) {
            handleDragEnd(info.offset.y);
            setIsCapturing(false);
          }
          startPointRef.current = null;
        }
      })}
      style={{ 
        touchAction: isMobile ? 'none' : 'auto',
        height: isMobile ? '25px' : '16px', // Larger touch target on mobile
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      className={`z-50 absolute left-0 w-full flex items-center justify-center bottom-0 pointer-events-auto ${isMobile ? 'mobile-gesture-area' : ''}`}
    >
      <motion.div
        animate={{ backgroundColor: color === 'dark' ? '#000000' : '#ffffff' }}
        className='w-5/12 h-1.5 rounded-full'
        style={{ pointerEvents: 'none' }} // Prevent interference with touch events
      />
    </motion.div>
  );
};

export default HomeBar;
