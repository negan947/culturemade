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

  // Authentic iOS-style gradient wallpaper (matching iOS 15/16 style)
  const iOSGradientBackground = (
    <div 
      className="absolute w-full h-full"
      style={{
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
        backgroundPosition: 'center center'
      }}
    />
  );

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
          {/* iOS Wallpaper Background */}
          {iOSGradientBackground}
          
          {/* System UI Layer */}
          <LayoutView />
          
          {/* Content Layer */}
          <div className="relative z-30 h-full">
            <AnimatePresence mode="wait">
              {isLocked ? (
                <LockScreen key="lockscreen" />
              ) : currentApp ? (
                <AppView key={`app-${currentApp}`} appId={currentApp} />
              ) : (
                <Home key="home" />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile view - fullscreen without frame */}
      <div className="block sm:hidden w-full h-screen relative overflow-hidden">
        {/* iOS Wallpaper Background */}
        {iOSGradientBackground}
        
        {/* System UI Layer */}
        <LayoutView />
        
        {/* Content Layer */}
        <div className="relative z-30 h-full">
          <AnimatePresence mode="wait">
            {isLocked ? (
              <LockScreen key="lockscreen" />
            ) : currentApp ? (
              <AppView key={`app-${currentApp}`} appId={currentApp} />
            ) : (
              <Home key="home" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IPhoneShell; 