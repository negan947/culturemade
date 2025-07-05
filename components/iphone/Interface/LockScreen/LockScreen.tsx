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
  const correctPasscode = "947491";

  useEffect(() => {
    // Only update time if not showing passcode to prevent unnecessary re-renders
    if (!showPasscode) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showPasscode]);

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
    if (passcode.length < 6) {
      const newPasscode = passcode + digit;
      setPasscode(newPasscode);
      
      if (newPasscode.length === 6) {
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

  // Lock Icon
  const LockIcon = () => (
    <svg width="24" height="30" viewBox="0 0 24 30" fill="currentColor">
      <path d="M12 0C8.7 0 6 2.7 6 6V10H4C2.9 10 2 10.9 2 12V26C2 27.1 2.9 28 4 28H20C21.1 28 22 27.1 22 26V12C22 10.9 21.1 10 20 10H18V6C18 2.7 15.3 0 12 0ZM12 2C14.2 2 16 3.8 16 6V10H8V6C8 3.8 9.8 2 12 2ZM12 18C13.1 18 14 17.1 14 16C14 14.9 13.1 14 12 14C10.9 14 10 14.9 10 16C10 17.1 10.9 18 12 18Z"/>
    </svg>
  );

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

  // Keypad data with letters
  const keypadData = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
  ];

  const PasscodeKeypad = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="absolute inset-0 flex flex-col justify-center px-6"
        style={{
          background: `
            linear-gradient(180deg, 
              #1e3a8a 0%,
              #0891b2 25%, 
              #059669 50%, 
              #dc2626 75%, 
              #be123c 100%
            )
          `
        }}
      >
      {/* Lock Icon */}
      <div className="flex justify-center mb-8 mt-20">
        <div className="text-white opacity-90">
          <LockIcon />
        </div>
      </div>

      {/* Enter Passcode Text */}
      <div className="text-center mb-8">
        <h2 className="text-white text-lg ios-medium sf-pro-text">Enter Passcode</h2>
      </div>

      {/* Passcode Dots - Changed to 6 */}
      <div className="flex justify-center mb-16">
        <div className="flex space-x-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full border border-white/60 ${
                index < passcode.length ? 'bg-white' : 'bg-transparent'
              }`}
              animate={isShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </div>

      {/* Keypad with letters */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-5 max-w-sm mx-auto mb-8">
        {keypadData.map(({ digit, letters }) => (
          <motion.button
            key={digit}
            onClick={() => handlePasscodeInput(digit)}
            className="relative w-20 h-20 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-white transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-3xl font-light leading-none">{digit}</span>
            {letters && (
              <span className="text-[10px] font-medium tracking-wider mt-0.5 opacity-80">
                {letters}
              </span>
            )}
          </motion.button>
        ))}
        
        {/* Empty space, 0, Delete */}
        <div></div>
        <motion.button
          onClick={() => handlePasscodeInput('0')}
          className="relative w-20 h-20 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <span className="text-3xl font-light">0</span>
        </motion.button>
        <motion.button
          onClick={handleDelete}
          className="relative w-20 h-20 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {/* Simplified iOS-style delete icon */}
          <svg width="24" height="18" viewBox="0 0 24 18" fill="currentColor" className="opacity-90">
            <path d="M8.5 0L0 9L8.5 18H24V0H8.5ZM22 16H9.5L2.5 9L9.5 2H22V16ZM11.5 5L10 6.5L13.5 10L10 13.5L11.5 15L15 11.5L18.5 15L20 13.5L16.5 10L20 6.5L18.5 5L15 8.5L11.5 5Z"/>
          </svg>
        </motion.button>
      </div>
      
      {/* Bottom buttons */}
      <div className="flex justify-between items-center px-6 pb-12">
        <motion.button
          className="text-white text-base ios-medium opacity-90"
          whileTap={{ scale: 0.95, opacity: 0.6 }}
        >
          Emergency
        </motion.button>
        <motion.button
          onClick={() => setShowPasscode(false)}
          className="text-white text-base ios-medium opacity-90"
          whileTap={{ scale: 0.95, opacity: 0.6 }}
        >
          Cancel
        </motion.button>
      </div>
    </motion.div>
    );
  };

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
      style={{
        background: showPasscode ? 'transparent' : `
          linear-gradient(180deg, 
            #1e3a8a 0%,
            #0891b2 25%, 
            #059669 50%, 
            #dc2626 75%, 
            #be123c 100%
          )
        `
      }}
    >
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top section with time and date - positioned like iOS */}
        {!showPasscode && (
          <div className="pt-20 px-6">
            {/* Date */}
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="ios-lock-date opacity-90">
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
              <div className="ios-lock-time">
                {formatTime(currentTime)}
              </div>
            </motion.div>
          </div>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-1" />

        {/* Bottom section */}
        {!showPasscode && (
          <motion.div
            className="pb-8 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Camera and Flashlight shortcuts */}
            <div className="flex justify-between items-center mb-4">
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
                <div className="text-base ios-medium opacity-60 sf-pro-text tracking-tight">
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