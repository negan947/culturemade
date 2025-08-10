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
        className='relative overflow-hidden bg-black sm:border-[14px] sm:border-black sm:rounded-[60px] sm:shadow-2xl w-full h-full sm:h-[890px] sm:w-[410px]'
        style={{
          aspectRatio: '18/39',
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Unified Background Layer */}
        <div
          className='absolute inset-0 w-full h-full'
          style={iOSWallpaperStyles}
        />

        {/* System UI */}
        <ErrorBoundary level='component'>
          <LayoutView />
        </ErrorBoundary>

        {/* Lock Screen Overlay */}
        {isLocked && (
          <motion.div
            key='lockscreen'
            className='absolute inset-0 z-50'
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{ background: 'none', backdropFilter: 'none' }}
          >
            <ErrorBoundary level='component'>
              <LockScreen />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Home & AppView shared layout */}
        <LayoutGroup id='iphone-interface-group'>
          <AnimatePresence>
            {!isLocked && (
              <ErrorBoundary key='homescreen' level='component'>
                {children}
              </ErrorBoundary>
            )}
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
