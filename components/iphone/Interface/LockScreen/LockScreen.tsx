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
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Format like iOS (9:41 style)
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes}`;
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

  // iOS Camera Icon
  const CameraIcon = () => (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="currentColor">
      <path d="M26 5H22.5L20.5 2H16C15.5 2 15 1.5 15 1C15 0.5 14.5 0 14 0C13.5 0 13 0.5 13 1C13 1.5 12.5 2 12 2H7.5L5.5 5H2C0.9 5 0 5.9 0 7V19C0 20.1 0.9 21 2 21H26C27.1 21 28 20.1 28 19V7C28 5.9 27.1 5 26 5ZM14 18C10.7 18 8 15.3 8 12C8 8.7 10.7 6 14 6C17.3 6 20 8.7 20 12C20 15.3 17.3 18 14 18ZM14 8C11.8 8 10 9.8 10 12C10 14.2 11.8 16 14 16C16.2 16 18 14.2 18 12C18 9.8 16.2 8 14 8Z"/>
    </svg>
  );

  // iOS Flashlight Icon  
  const FlashlightIcon = () => (
    <svg width="16" height="28" viewBox="0 0 16 28" fill="currentColor">
      <path d="M8 0C7.4 0 7 0.4 7 1V2H9V1C9 0.4 8.6 0 8 0ZM1.5 2.5L0.1 3.9L2.8 6.6L4.2 5.2L1.5 2.5ZM14.5 2.5L11.8 5.2L13.2 6.6L15.9 3.9L14.5 2.5ZM8 4C5.8 4 4 5.8 4 8C4 8.3 4 8.5 4.1 8.8L4.8 11L11.2 11L11.9 8.8C11.9 8.5 12 8.3 12 8C12 5.8 10.2 4 8 4ZM5.5 13V26.5C5.5 27.3 6.2 28 7 28H9C9.8 28 10.5 27.3 10.5 26.5V13H5.5Z"/>
    </svg>
  );

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
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl font-light active:bg-white/20 transition-colors sf-pro-display"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {digit}
          </motion.button>
        ))}
        
        <div></div>
        <motion.button
          onClick={() => handlePasscodeInput('0')}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl font-light active:bg-white/20 transition-colors sf-pro-display"
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
      
      <motion.button
        onClick={() => setShowPasscode(false)}
        className="absolute bottom-4 right-6 text-white/60 text-sm sf-pro-text"
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top section with time and date - positioned like iOS */}
        <div className="pt-20 px-6">
          {/* Date */}
          <motion.div
            className="text-center mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-lg font-medium opacity-90 sf-pro-text tracking-tight">
              {formatDate(currentTime)}
            </div>
          </motion.div>

          {/* Time */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-8xl font-thin tracking-tighter sf-pro-display" style={{ fontSize: '96px', lineHeight: '1', fontWeight: '100' }}>
              {formatTime(currentTime)}
            </div>
          </motion.div>
        </div>

        {/* Spacer to push bottom content down */}
        <div className="flex-1" />

        {/* Bottom section */}
        {!showPasscode && (
          <motion.div
            className="pb-10 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Camera and Flashlight shortcuts */}
            <div className="flex justify-between items-center mb-8">
              <motion.button
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FlashlightIcon />
              </motion.button>

              <motion.button
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CameraIcon />
              </motion.button>
            </div>

            {/* Swipe indicator - exactly like iOS */}
            <div className="text-center">
              <motion.div
                className="flex flex-col items-center space-y-2"
                animate={{ y: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <div className="text-base font-medium opacity-60 sf-pro-text tracking-tight">
                  Swipe up to unlock
                </div>
                <div className="w-32 h-1 bg-white/40 rounded-full" />
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