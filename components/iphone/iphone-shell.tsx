"use client";

import { RootState } from "@/store/store";
import Image from "next/image";
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

  return (
    <div className="select-none flex justify-center items-center min-h-screen bg-black">
      {/* Desktop view - iPhone with frame */}
      <div className="hidden sm:block p-6">
        <motion.main className="relative overflow-hidden aspect-iphone h-[890px] border-[13px] border-black bg-black box-content rounded-[60px] shadow-2xl">
          <LayoutView />
          <Image
            className="absolute w-full h-full object-cover"
            draggable={false}
            src="/images/wallpaper.png"
            width={2000}
            height={3000}
            priority
            alt="wallpaper"
          />
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
          <Image
            className="absolute w-full h-full object-cover"
            draggable={false}
            src="/images/wallpaper.png"
            width={2000}
            height={3000}
            priority
            alt="wallpaper"
          />
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