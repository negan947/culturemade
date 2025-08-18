'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { FC, ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { ErrorBoundary } from '@/components/error/error-boundary';
import { RootState } from '@/store/store';

import { getAllApps } from './apps/getApp';
import AppView from './Interface/AppView/AppView';
import LockScreen from './Interface/LockScreen/LockScreen';
import LayoutView from './Interface/SystemLayout/LayoutView';

interface Props {
  children: ReactNode;
}

const IPhoneShell: FC<Props> = ({ children }) => {
  const currentApp = useSelector((state: RootState) => state.interface.appId);
  const isLocked = useSelector((state: RootState) => state.interface.isLocked);

  // Preload app icons and wallpaper when component mounts (before unlock)
  useEffect(() => {
    const preloadImages = async () => {
      const apps = getAllApps();
      
      // Preload all app icons
      const iconPromises = apps.map((app) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if some icons fail to load
          img.src = `/images/icons/${app.icon}.png`;
        });
      });

      // Preload wallpaper
      const wallpaperPromise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = '/images/wallpaper-cm.jpg';
      });

      try {
        await Promise.all([...iconPromises, wallpaperPromise]);
        console.log('App icons and wallpaper preloaded successfully');
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    };

    preloadImages();
  }, []);

  // Shared iOS wallpaper background - single source of truth
  const iOSWallpaperStyles = {
    background: `url('/images/wallpaper-cm.jpg') center / cover no-repeat`,
  };

  return (
    <div className='select-none flex justify-center items-center h-screen-dvh sm:h-screen bg-black overflow-hidden pt-safe-top pb-safe-bottom sm:pt-0 sm:pb-0'>
      <motion.div
        className='iphone-shell relative overflow-hidden bg-black sm:border-[14px] sm:border-black sm:shadow-2xl w-full h-full sm:h-[890px] sm:w-[410px]'
        style={{
          aspectRatio: '18/39',
          borderRadius: '60px',
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Base Background Layer */}
        <div
          className='absolute inset-0 w-full h-full'
          style={{
            ...iOSWallpaperStyles,
            backgroundSize: '102%', // Slightly larger to cover corners
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Extended background overlay - slightly darker to reduce bleeding
     contrast */}
      
        <div
          className='absolute w-full h-full'
          style={{
            backgroundImage: "url('/images/wallpaper-cm.jpg')",
            backgroundSize: '104%', // Even larger to cover bleeding better
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '58px',
            top: '-1px',
            left: '-1px',
            width: 'calc(100% + 3px)',
           height: 'calc(100% + 1px)',
            // Subtle darkening overlay to reduce white bleeding contrast
           backgroundBlendMode: 'multiply',
          backgroundColor: 'rgba(245, 245, 245, 0.98)', // Very slight gray
          }}
        />

        {/* System UI */}
        <ErrorBoundary level='component'>
          <LayoutView />
        </ErrorBoundary>

        {/* Lock Screen Overlay */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              key='lockscreen'
              className='absolute inset-0 z-50'
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 1.1, 
                filter: 'blur(10px)',
                pointerEvents: 'none' // CRITICAL: Disable touch events during exit
              }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{ background: 'none', backdropFilter: 'none' }}
            >
              <ErrorBoundary level='component'>
                <LockScreen />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Home & AppView shared layout - Always mounted to prevent refresh animation */}
        <LayoutGroup id='iphone-interface-group'>
          {/* Home screen - always mounted but hidden when locked */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: !isLocked && !currentApp ? 1 : 0,
              pointerEvents: !isLocked && !currentApp ? 'auto' : 'none',
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ErrorBoundary key='homescreen' level='component'>
              {children}
            </ErrorBoundary>
          </motion.div>
          
          {/* App view - only mount when needed */}
          <AnimatePresence>
            {!isLocked && currentApp && (
              <ErrorBoundary key={`app-${currentApp}`} level='component'>
                <AppView appId={currentApp} />
              </ErrorBoundary>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  );
};

export default IPhoneShell;
