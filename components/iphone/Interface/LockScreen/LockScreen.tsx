"use client";

import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { interfaceActions } from "@/store/interface-slice";

const LockScreen: FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const correctPasscode = "9474";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleSwipeUp = () => {
    setShowPasscode(true);
  };

  const handlePasscodeInput = (digit: string) => {
    if (passcode.length < 4) {
      const newPasscode = passcode + digit;
      setPasscode(newPasscode);
      
      if (newPasscode.length === 4) {
        setTimeout(() => {
          if (newPasscode === correctPasscode) {
            dispatch(interfaceActions.unlock());
          } else {
            setIsShaking(true);
            setPasscode("");
            setTimeout(() => setIsShaking(false), 500);
          }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPasscode(passcode.slice(0, -1));
  };

  const PasscodeKeypad = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute bottom-0 left-0 right-0 px-6 pb-8"
    >
      {/* Passcode Dots */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className={`w-4 h-4 rounded-full border-2 border-white/60 ${
                index < passcode.length ? 'bg-white' : 'bg-transparent'
              }`}
              animate={isShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <motion.button
            key={digit}
            onClick={() => handlePasscodeInput(digit)}
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl font-light active:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {digit}
          </motion.button>
        ))}
        
        {/* Emergency and 0 and Delete */}
        <div></div>
        <motion.button
          onClick={() => handlePasscodeInput('0')}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl font-light active:bg-white/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          0
        </motion.button>
        <motion.button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:bg-white/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
            <path d="M8 0C9.1 0 10.1 0.4 10.8 1.1L12.4 2.7C12.7 3 13.1 3.2 13.5 3.2H18C19.1 3.2 20 4.1 20 5.2V12.8C20 13.9 19.1 14.8 18 14.8H13.5C13.1 14.8 12.7 14.6 12.4 14.3L10.8 12.7C10.1 12 9.1 11.6 8 11.6H2C0.9 11.6 0 10.7 0 9.6V2C0 0.9 0.9 0 2 0H8ZM13.7 5.7L12.3 4.3L10 6.6L7.7 4.3L6.3 5.7L8.6 8L6.3 10.3L7.7 11.7L10 9.4L12.3 11.7L13.7 10.3L11.4 8L13.7 5.7Z"/>
          </svg>
        </motion.button>
      </div>
      
      {/* Cancel */}
      <motion.button
        onClick={() => setShowPasscode(false)}
        className="absolute bottom-4 right-6 text-white/60 text-sm"
        whileTap={{ scale: 0.95 }}
      >
        Cancel
      </motion.button>
    </motion.div>
  );

  return (
    <motion.div
      className="absolute inset-0 z-50 text-white overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.4 }}
      drag={showPasscode ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (!showPasscode && info.offset.y < -100) {
          handleSwipeUp();
        }
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top section with time and date */}
        <div className="flex-1 flex flex-col justify-center px-6 pt-20 pb-4">
          {/* Time */}
          <motion.div
            className="text-center mb-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-6xl sm:text-7xl font-thin tracking-tight">
              {formatTime(currentTime)}
            </div>
          </motion.div>

          {/* Date */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-lg font-medium opacity-80">
              {formatDate(currentTime)}
            </div>
          </motion.div>

          {/* CultureMade Branding */}
          <motion.div
            className="text-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-sm font-semibold tracking-[0.3em] uppercase mb-2 opacity-90">
              CULTUREMADE
            </div>
            <div className="text-xs opacity-60">
              Something Raw is Coming
            </div>
          </motion.div>
        </div>

        {/* Bottom section */}
        {!showPasscode && (
          <motion.div
            className="pb-8 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* Camera and Flashlight shortcuts */}
            <div className="flex justify-between items-center mb-6">
              <motion.button
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </motion.button>

              <motion.button
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l3-3 3 3v13"/>
                  <circle cx="12" cy="2" r="1"/>
                </svg>
              </motion.button>
            </div>

            {/* Swipe indicator */}
            <div className="text-center">
              <motion.div
                className="inline-flex items-center space-x-2 text-sm opacity-60"
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span>Swipe up to unlock</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Passcode Keypad */}
        <AnimatePresence>
          {showPasscode && <PasscodeKeypad />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LockScreen; 