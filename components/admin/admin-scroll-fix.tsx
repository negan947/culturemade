'use client';

import { useEffect } from 'react';

export function AdminScrollFix() {
  useEffect(() => {
    // Override global CSS for admin pages to allow scrolling
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlPosition = document.documentElement.style.position;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyHeight = document.body.style.height;

    // Apply admin-specific styles
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.position = 'static';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.height = 'auto';

    // Cleanup function to restore original styles
    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.position = originalHtmlPosition;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.height = originalBodyHeight;
    };
  }, []);

  return null;
}