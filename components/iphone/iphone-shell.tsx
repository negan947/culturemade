"use client";

import { RootState } from "@/store/store";
import { FC } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import AppView from "./Interface/AppView/AppView";
import LayoutView from "./Interface/SystemLayout/LayoutView";
import LockScreen from "./Interface/LockScreen/LockScreen";

interface Props {
  children: JSX.Element;
}

const IPhoneShell: FC<Props> = ({ children }) => {
  const currentApp = useSelector((state: RootState) => state.interface.appId);
  const isLocked = useSelector((state: RootState) => state.interface.isLocked);

  // Shared iOS wallpaper background - single source of truth
  const iOSWallpaperStyles = {
    background: `
      radial-gradient(circle at 15% 25%, rgba(30, 58, 138, 0.8) 0%, transparent 60%),
      radial-gradient(circle at 85% 20%, rgba(8, 145, 178, 0.7) 0%, transparent 55%),
      radial-gradient(circle at 45% 80%, rgba(5, 150, 105, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 80% 85%, rgba(220, 38, 38, 0.7) 0%, transparent 45%),
      radial-gradient(circle at 20% 90%, rgba(190, 18, 60, 0.6) 0%, transparent 40%),
      linear-gradient(135deg, #1e3a8a 0%, #0891b2 25%, #059669 50%, #dc2626 75%, #be123c 100%)
    `,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="select-none flex justify-center items-center min-h-screen bg-black">
      <motion.div
        className="relative overflow-hidden bg-black sm:border-[14px] sm:border-black sm:rounded-[60px] sm:shadow-2xl w-full h-screen sm:h-[890px] sm:w-[410px]"
        style={{ aspectRatio: '18/39' }}
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