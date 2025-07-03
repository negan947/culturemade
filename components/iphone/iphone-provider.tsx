'use client';

import { Provider } from 'react-redux';
import { iPhoneStore, setBattery, setSignal } from '@/store/iphone-store';
import { createContext, useContext, useEffect, ReactNode } from 'react';

// iPhone Context (for additional non-Redux state if needed)
interface iPhoneContextType {
  isDevelopmentMode: boolean;
  enableDebugControls: boolean;
}

const iPhoneContext = createContext<iPhoneContextType>({
  isDevelopmentMode: process.env.NODE_ENV === 'development',
  enableDebugControls: process.env.NODE_ENV === 'development',
});

export const useIphoneContext = () => useContext(iPhoneContext);

interface iPhoneProviderProps {
  children: ReactNode;
  enableDebugControls?: boolean;
}

export function IPhoneProvider({ children, enableDebugControls = false }: iPhoneProviderProps) {
  const isDevelopmentMode = process.env.NODE_ENV === 'development';

  // System status updates (simulate realistic iPhone behavior)
  useEffect(() => {
    if (!isDevelopmentMode) return;

    const interval = setInterval(() => {
      // Simulate battery drain
      const currentBattery = iPhoneStore.getState().iphone.battery;
      const newBattery = Math.max(0, currentBattery - Math.random() * 0.1);
      iPhoneStore.dispatch(setBattery(newBattery));

      // Simulate signal fluctuation
      const currentSignal = iPhoneStore.getState().iphone.signal;
      const change = (Math.random() - 0.5) * 0.5;
      const newSignal = Math.max(0, Math.min(4, currentSignal + change));
      iPhoneStore.dispatch(setSignal(Math.round(newSignal)));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isDevelopmentMode]);

  // Realistic time-based system behavior
  useEffect(() => {
    const hour = new Date().getHours();
    
    // Auto dark mode between 8 PM and 6 AM
    if (iPhoneStore.getState().iphone.theme === 'auto') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const shouldBeDark = hour >= 20 || hour < 6;
      // This would trigger theme change in a real implementation
    }

    // Low power mode warning
    if (iPhoneStore.getState().iphone.battery < 20) {
      console.log('iPhone: Low battery warning would appear');
    }
  }, []);

  const contextValue: iPhoneContextType = {
    isDevelopmentMode,
    enableDebugControls: enableDebugControls && isDevelopmentMode,
  };

  return (
    <Provider store={iPhoneStore}>
      <iPhoneContext.Provider value={contextValue}>
        <div className="iphone-provider">
          {children}
        </div>
      </iPhoneContext.Provider>
    </Provider>
  );
}

// Dev controls component (only shown in development)
export function DevControls() {
  const { enableDebugControls } = useIphoneContext();
  
  if (!enableDebugControls) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-sm font-bold mb-2">iPhone Dev Controls</h3>
      <div className="space-y-2 text-xs">
        <div>Use ⌘+K for quick actions</div>
        <div>Use ⌘+D to toggle debug info</div>
        <div>Use ⌘+R to reload iPhone state</div>
      </div>
    </div>
  );
} 