"use client";

import Image from "next/image";
import { FC, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
// import { useCurrentApp } from "@/hooks/use-iphone-state"; // TODO: Will be used when AppView is implemented

// TODO: Import these components when they're created
// import AppView from "../Interface/AppView/AppView";
// import NotificationView from "../Interface/Notifications/NotificationView";
import LayoutView from "../Interface/SystemLayout/LayoutView";
import Credits from "../Interface/SystemLayout/Credits";

interface Props {
  children: ReactNode;
}

const RootLayout: FC<Props> = ({ children }) => {
  // const currentApp = useCurrentApp(); // TODO: Will be used when AppView is implemented

  return (
    <div className="select-none p-6 sizing box-border flex justify-center">
      <Credits />
      <motion.main className="relative overflow-hidden aspect-iphone h-[890px] border-[13px] border-black bg-black box-content rounded-[60px]">
        <LayoutView />
        {/* TODO: Add NotificationView component */}
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
          <AnimatePresence>
            {children}
            {/* TODO: Add AppView when currentApp is open */}
            {/* {currentApp && <AppView key={"appview"} appId={currentApp} />} */}
          </AnimatePresence>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default RootLayout; 