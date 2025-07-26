import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/store';

// Authentic iOS Status Icons
const LockIcon = () => (
  <svg width='11' height='14' viewBox='0 0 11 14' fill='currentColor'>
    <path d='M5.5 0C3.567 0 2 1.567 2 3.5V5H1.5C0.672 5 0 5.672 0 6.5V12.5C0 13.328 0.672 14 1.5 14H9.5C10.328 14 11 13.328 11 12.5V6.5C11 5.672 10.328 5 9.5 5H9V3.5C9 1.567 7.433 0 5.5 0ZM5.5 1C6.881 1 8 2.119 8 3.5V5H3V3.5C3 2.119 4.119 1 5.5 1Z' />
  </svg>
);

// Real iOS signal bars (4-bar design)
const SignalIcon = ({ strength = 4 }: { strength?: number }) => (
  <div className='flex items-end space-x-1'>
    {[1, 2, 3, 4].map((bar) => (
      <div
        key={bar}
        className={`bg-current rounded-full transition-opacity ${
          bar <= strength ? 'opacity-100' : 'opacity-30'
        }`}
        style={{
          width: '3px',
          height: `${bar * 2 + 2}px`,
        }}
      />
    ))}
  </div>
);

// Authentic iOS WiFi icon
const WifiIcon = () => (
  <svg width='15' height='11' viewBox='0 0 15 11' fill='currentColor'>
    <path d='M7.5 11C8.05 11 8.5 10.55 8.5 10C8.5 9.45 8.05 9 7.5 9C6.95 9 6.5 9.45 6.5 10C6.5 10.55 6.95 11 7.5 11ZM7.5 0C11.64 0 15 2.243 15 5.014C15 5.562 14.78 6.081 14.386 6.464L12.93 7.92C12.54 8.31 11.96 8.31 11.57 7.92C11.18 7.53 11.18 6.95 11.57 6.56L12.386 5.744C12.78 5.36 13 4.841 13 4.293C13 2.88 10.52 2 7.5 2C4.48 2 2 2.88 2 4.293C2 4.841 2.22 5.36 2.614 5.744L3.43 6.56C3.82 6.95 3.82 7.53 3.43 7.92C3.04 8.31 2.46 8.31 2.07 7.92L0.614 6.464C0.22 6.081 0 5.562 0 5.014C0 2.243 3.36 0 7.5 0Z' />
  </svg>
);

// Real iOS battery icon with proper proportions
const BatteryIcon = ({ percentage = 100 }: { percentage?: number }) => (
  <div className='flex items-center'>
    <div className='relative'>
      <svg width='27' height='13' viewBox='0 0 27 13' fill='none'>
        {/* Battery outline - iOS style rounded rectangle */}
        <rect
          x='1'
          y='2'
          width='22'
          height='9'
          rx='2.5'
          stroke='currentColor'
          strokeWidth='1'
          fill='none'
        />
        {/* Battery terminal/tip */}
        <rect x='24' y='4.5' width='2' height='4' rx='1' fill='currentColor' />
        {/* Battery fill level */}
        <rect
          x='2'
          y='3'
          width={`${Math.max(0, (percentage / 100) * 20)}`}
          height='7'
          rx='1.5'
          fill='currentColor'
          className={
            percentage <= 20
              ? 'fill-red-500'
              : percentage <= 50
                ? 'fill-yellow-500'
                : 'fill-white'
          }
        />
      </svg>
    </div>
  </div>
);

const StatusBar = () => {
  const [time, setTime] = useState('');
  const color = useSelector(
    (state: RootState) => state.interface.statusBarColor
  );
  const isLocked = useSelector((state: RootState) => state.interface.isLocked);

  const updateTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Format time like iOS (9:41 style)
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes}`;
  };

  useEffect(() => {
    // Update time initially
    setTime(updateTime());

    // Only update time when not locked to prevent interference with lock screen
    if (!isLocked) {
      const interval = setInterval(() => {
        setTime(updateTime());
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isLocked]);

  return (
    <motion.div
      animate={{ color: color === 'dark' ? '#000000' : '#ffffff' }}
      className='absolute w-full z-50 flex justify-between items-center px-6 pt-2 pb-1'
      style={{ fontSize: '17px', top: '8px' }}
    >
      {/* Left side - Time with iOS font */}
      <div className='flex-1'>
        <p className='ios-status-time'>{time}</p>
      </div>

      {/* Right side - Status icons with proper spacing */}
      <div className='flex items-center space-x-1.5'>
        {isLocked && <LockIcon />}
        <SignalIcon strength={4} />
        <WifiIcon />
        <BatteryIcon percentage={100} />
      </div>
    </motion.div>
  );
};

export default StatusBar;
