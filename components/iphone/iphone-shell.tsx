"use client";

import { RootState } from "@/store/store";
import { FC } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import AppView from "./Interface/AppView/AppView";
import LayoutView from "./Interface/SystemLayout/LayoutView";
import Home from "./Interface/Home/Home";
import LockScreen from "./Interface/LockScreen/LockScreen";

const IPhoneShell: FC = () => {
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
      {/* Desktop view - iPhone with frame */}
      <div className="hidden sm:block p-6">
        <motion.div 
          className="relative overflow-hidden bg-black border-[14px] border-black rounded-[60px] shadow-2xl"
          style={{ 
            aspectRatio: '18/39',
            height: '890px',
            width: '410px'
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* FIXED: Unified Background Layer - Single background for all states */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={iOSWallpaperStyles}
          />
          
          {/* System UI Layer - Always on top */}
          <LayoutView />
          
          {/* Content Layer - Clean separation */}
          <div className="relative z-30 h-full">
            {/* Lock Screen - Isolated layer */}
            <AnimatePresence mode="wait">
              {isLocked && (
                <motion.div
                  key="lockscreen"
                  className="absolute inset-0 z-50"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ 
                    opacity: 0, 
                    scale: 1.1,
                    filter: "blur(10px)"
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  style={{
                    // CRITICAL: Ensure no background interference
                    background: 'none',
                    backdropFilter: 'none'
                  }}
                >
                  <LockScreen />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content - Only render when unlocked */}
            <AnimatePresence mode="wait">
              {!isLocked && (
                <motion.div
                  key="main-content"
                  className="absolute inset-0"
                  initial={{ 
                    opacity: 0, 
                    scale: 0.95,
                    filter: "blur(5px)"
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    filter: "blur(0px)"
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95,
                    filter: "blur(5px)"
                  }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.2,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                >
                  {/* CRITICAL: Single AnimatePresence contains both Home and AppView */}
                  <AnimatePresence>
                    <Home key="home" />
                    {currentApp && <AppView key="appview" appId={currentApp} />}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile view - fullscreen without frame */}
      <div className="block sm:hidden w-full h-screen relative overflow-hidden">
        {/* FIXED: Unified Background Layer - Single background for all states */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={iOSWallpaperStyles}
        />
        
        {/* System UI Layer - Always on top */}
        <LayoutView />
        
        {/* Content Layer - Clean separation */}
        <div className="relative z-30 h-full">
          {/* Lock Screen - Isolated layer */}
          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div
                key="lockscreen"
                className="absolute inset-0 z-50"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 1.1,
                  filter: "blur(10px)"
                }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1]
                }}
                style={{
                  // CRITICAL: Ensure no background interference
                  background: 'none',
                  backdropFilter: 'none'
                }}
              >
                <LockScreen />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content - Only render when unlocked */}
          <AnimatePresence mode="wait">
            {!isLocked && (
              <motion.div
                key="main-content"
                className="absolute inset-0"
                initial={{ 
                  opacity: 0, 
                  scale: 0.95,
                  filter: "blur(5px)"
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  filter: "blur(0px)"
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.95,
                  filter: "blur(5px)"
                }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.2,
                  ease: [0.23, 1, 0.32, 1]
                }}
              >
                {/* CRITICAL: Single AnimatePresence contains both Home and AppView */}
                <AnimatePresence>
                  <Home key="home" />
                  {currentApp && <AppView key="appview" appId={currentApp} />}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IPhoneShell; 