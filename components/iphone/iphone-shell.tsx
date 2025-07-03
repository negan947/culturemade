"use client";

import { RootState } from "@/store/store";
import Image from "next/image";
import { FC } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import AppView from "./Interface/AppView/AppView";
import LayoutView from "./Interface/SystemLayout/LayoutView";
import Home from "./Interface/Home/Home";

const IPhoneShell: FC = () => {
  const currentApp = useSelector((state: RootState) => state.interface.appId);

  return (
    <div className="select-none p-6 sizing box-border flex justify-center">
      <motion.main className="relative overflow-hidden aspect-iphone h-[890px] border-[13px] border-black bg-black box-content rounded-[60px]">
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
          <AnimatePresence>
            <Home />
            {currentApp && <AppView key={"appview"} appId={currentApp} />}
          </AnimatePresence>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default IPhoneShell; 