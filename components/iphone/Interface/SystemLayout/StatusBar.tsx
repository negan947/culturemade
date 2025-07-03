import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// iOS Status Icons Components
const LockIcon = () => (
  <svg width="11" height="14" viewBox="0 0 11 14" fill="currentColor">
    <path d="M5.5 0C3.567 0 2 1.567 2 3.5V5H1.5C0.672 5 0 5.672 0 6.5V12.5C0 13.328 0.672 14 1.5 14H9.5C10.328 14 11 13.328 11 12.5V6.5C11 5.672 10.328 5 9.5 5H9V3.5C9 1.567 7.433 0 5.5 0ZM5.5 1C6.881 1 8 2.119 8 3.5V5H3V3.5C3 2.119 4.119 1 5.5 1Z"/>
  </svg>
);

const SignalIcon = ({ strength = 4 }: { strength?: number }) => (
  <div className="flex items-end space-x-0.5">
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

const WifiIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
    <path d="M8.5 0C13.194 0 17 2.243 17 5.014c0 .548-.22 1.067-.614 1.45L8.5 12 .614 6.464C.22 6.081 0 5.562 0 5.014 0 2.243 3.806 0 8.5 0z"/>
  </svg>
);

const BatteryIcon = ({ percentage = 100 }: { percentage?: number }) => (
  <div className="flex items-center">
    <div className="relative">
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        {/* Battery outline */}
        <rect 
          x="1" 
          y="2" 
          width="22" 
          height="9" 
          rx="2.5" 
          stroke="currentColor" 
          strokeWidth="1" 
          fill="none"
        />
        {/* Battery tip */}
        <rect 
          x="24" 
          y="4.5" 
          width="2" 
          height="4" 
          rx="1" 
          fill="currentColor"
        />
        {/* Battery fill */}
        <rect 
          x="2" 
          y="3" 
          width={`${(percentage / 100) * 20}`} 
          height="7" 
          rx="1.5" 
          fill="currentColor"
          className={percentage <= 20 ? 'fill-red-500' : 'fill-white'}
        />
      </svg>
    </div>
  </div>
);

const StatusBar = () => {
  const [time, setTime] = useState("");
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
    const interval = setInterval(() => {
      setTime(updateTime());
    }, 1000);
    
    // Set initial time
    setTime(updateTime());
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{ color: color === "dark" ? "#000000" : "#ffffff" }}
      className="absolute w-full z-50 flex justify-between items-center sf-pro-text font-semibold px-6 pt-2 pb-1"
      style={{ fontSize: '17px', top: '8px' }}
    >
      {/* Left side - Time */}
      <div className="flex-1">
        <p className="font-semibold tracking-tight">{time}</p>
      </div>
      
      {/* Right side - Status icons */}
      <div className="flex items-center space-x-1.5">
        {isLocked && <LockIcon />}
        <SignalIcon strength={4} />
        <WifiIcon />
        <BatteryIcon percentage={100} />
      </div>
    </motion.div>
  );
};

export default StatusBar; 