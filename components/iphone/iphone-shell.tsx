"use client";

import { RootState } from "@/store/store";
import { FC, ReactNode } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import AppView from "./Interface/AppView/AppView";
import LayoutView from "./Interface/SystemLayout/LayoutView";
import LockScreen from "./Interface/LockScreen/LockScreen";

interface Props {
  children: ReactNode;
}

const IPhoneShell: FC<Props> = ({ children }) => {
  const currentApp = useSelector((state: RootState) => state.interface.appId);
  const isLocked = useSelector((state: RootState) => state.interface.isLocked);

  // Shared iOS wallpaper background - single source of truth
  const iOSWallpaperStyles = {
    background: `url('/images/wallpaper-cm.jpg') center / cover no-repeat`,
  };

  return (
    <div className="select-none flex justify-center items-center h-screen-dvh sm:h-screen bg-black overflow-hidden pt-safe-top pb-safe-bottom">
      <motion.div
        className="relative overflow-hidden bg-black sm:border-[14px] sm:border-black sm:rounded-[60px] sm:shadow-2xl w-full h-full sm:h-[890px] sm:w-[410px]"
        style={{ 
          aspectRatio: '18/39',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          height: '100%'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Unified Background Layer */}
        <div className="absolute inset-0 w-full h-full" style={iOSWallpaperStyles} />

        {/* System UI */}
        <LayoutView />

        {/* Lock Screen Overlay */}
        {isLocked && (
          <motion.div
            key="lockscreen"
            className="absolute inset-0 z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{ background: 'none', backdropFilter: 'none' }}
          >
            <LockScreen />
          </motion.div>
        )}

        {/* Home & AppView shared layout */}
        <LayoutGroup id="iphone-interface-group">
          <AnimatePresence>
            {!isLocked && children}
            {!isLocked && currentApp && <AppView key="appview" appId={currentApp} />}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  );
};

export default IPhoneShell; 