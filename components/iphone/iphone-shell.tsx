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

  // iOS-style colorful gradient background
  const iOSGradientBackground = (
    <div 
      className="absolute w-full h-full"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, #ff6b6b 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, #ffd93d 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, #6bcf7f 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, #4dabf7 0%, transparent 50%),
          radial-gradient(circle at 10% 10%, #845ef7 0%, transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 100%)
        `
      }}
    />
  );

  return (
    <div className="select-none flex justify-center items-center min-h-screen bg-black">
      {/* Desktop view - iPhone with frame */}
      <div className="hidden sm:block p-6">
        <motion.main className="relative overflow-hidden aspect-iphone h-[890px] border-[13px] border-black bg-black box-content rounded-[60px] shadow-2xl">
          <LayoutView />
          {iOSGradientBackground}
          <motion.div className="relative z-30 h-full">
            <AnimatePresence mode="wait">
              {isLocked ? (
                <LockScreen key="lockscreen" />
              ) : (
                <>
                  <Home key="home" />
                  {currentApp && <AppView key={"appview"} appId={currentApp} />}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.main>
      </div>

      {/* Mobile view - Full screen iPhone experience */}
      <div className="block sm:hidden w-full h-screen">
        <motion.main className="relative overflow-hidden w-full h-full bg-black">
          <LayoutView />
          {iOSGradientBackground}
          <motion.div className="relative z-30 h-full">
            <AnimatePresence mode="wait">
              {isLocked ? (
                <LockScreen key="lockscreen" />
              ) : (
                <>
                  <Home key="home" />
                  {currentApp && <AppView key={"appview"} appId={currentApp} />}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default IPhoneShell; 