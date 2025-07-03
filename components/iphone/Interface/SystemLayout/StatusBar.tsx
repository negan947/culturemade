import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// iOS Status Icons Components
const SignalIcon = ({ strength = 4 }: { strength?: number }) => (
  <div className="flex items-end space-x-0.5">
    {[1, 2, 3, 4].map((bar) => (
      <div
        key={bar}
        className={`w-0.5 bg-current transition-opacity ${
          bar <= strength ? 'opacity-100' : 'opacity-30'
        }`}
        style={{ height: `${bar * 2 + 2}px` }}
      />
    ))}
  </div>
);

const WifiIcon = () => (
  <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
    <path d="M7.5 0C3.36 0 0 1.69 0 3.78c0 .42.14.83.41 1.17L7.5 11l7.09-6.05c.27-.34.41-.75.41-1.17C15 1.69 11.64 0 7.5 0z"/>
  </svg>
);

const LTEIcon = () => (
  <span className="text-xs font-medium tracking-tight">LTE</span>
);

const BatteryIcon = ({ percentage = 85 }: { percentage?: number }) => (
  <div className="flex items-center space-x-1">
    <div className="relative">
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="text-current">
        <rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/>
        <rect x="21.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor"/>
        <rect 
          x="2" 
          y="3" 
          width={`${(percentage / 100) * 18}`} 
          height="6" 
          rx="1" 
          fill="currentColor"
          className={percentage <= 20 ? 'fill-red-500' : percentage <= 50 ? 'fill-yellow-500' : 'fill-current'}
        />
      </svg>
    </div>
    <span className="text-xs font-medium">{percentage}%</span>
  </div>
);

const StatusBar = () => {
  const [time, setTime] = useState("");
  const color = useSelector(
    (state: RootState) => state.interface.statusBarColor
  );

  const updateTime = () => {
    const _hours = new Date().getHours();
    const _minutes = new Date().getMinutes();

    const hours = _hours <= 9 ? `0${_hours}` : _hours;
    const minutes = _minutes <= 9 ? `0${_minutes}` : _minutes;

    return `${hours}:${minutes}`;
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
      className="absolute w-full z-50 flex justify-between items-center text-sm font-semibold py-3 px-6"
    >
      {/* Left side - Time */}
      <div className="flex-1">
        <p className="font-semibold">{time}</p>
      </div>
      
      {/* Right side - Status icons */}
      <div className="flex items-center space-x-1">
        <SignalIcon strength={4} />
        <LTEIcon />
        <WifiIcon />
        <BatteryIcon percentage={87} />
      </div>
    </motion.div>
  );
};

export default StatusBar; 