"use client";

import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { interfaceActions } from "@/store/interface-slice";

const LockScreen: FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSwipeUp = () => {
    dispatch(interfaceActions.unlock());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-black/30 backdrop-blur-md"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -100) {
          handleSwipeUp();
        }
      }}
    >
      {/* Time Display */}
      <div className="text-center mb-4">
        <motion.div
          className="text-7xl font-thin tracking-tight"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {formatTime(currentTime)}
        </motion.div>
        <motion.div
          className="text-lg font-medium opacity-80 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {formatDate(currentTime)}
        </motion.div>
      </div>

      {/* CultureMade Branding */}
      <motion.div
        className="absolute bottom-32 text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-sm font-semibold tracking-[0.2em] uppercase mb-2">
          CULTUREMADE
        </div>
        <div className="text-xs opacity-60">
          Something Raw is Coming
        </div>
      </motion.div>

      {/* Swipe Up Indicator */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, repeat: Infinity, repeatType: "reverse", duration: 2 }}
      >
        <div className="text-xs opacity-60 mb-2">Swipe up to unlock</div>
        <motion.div
          className="w-8 h-1 bg-white/40 rounded-full"
          animate={{ y: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </motion.div>

      {/* Ambient Lighting Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
    </motion.div>
  );
};

export default LockScreen; 