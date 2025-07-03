import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '@/store/iphone-store';
import {
  unlockPhone,
  lockPhone,
  openApp,
  closeApp,
  goHome,
  switchToApp,
  closeBackgroundApp,
  setHomeScreenPage,
  updateAppPosition,
  setReordering,
  addNotification,
  markNotificationRead,
  clearNotifications,
  setBattery,
  setCharging,
  setSignal,
  setWifi,
  setBluetooth,
  setAirplaneMode,
  setDndMode,
  setLowPowerMode,
  setBrightness,
  setVolume,
  setMuted,
  toggleFlashlight,
  setWallpaper,
  setTheme,
  setDynamicIsland,
  toggleControlCenter,
  closeControlCenter,
  setSwipeDirection,
} from '@/store/iphone-store';

// Custom hooks for iPhone store
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);

// Specific iPhone state selectors
export const useIPhone = () => useAppSelector((state) => state.iphone);
export const useIPhoneApps = () => useAppSelector((state) => state.iphone.apps);
export const useCurrentApp = () => useAppSelector((state) => state.iphone.currentApp);
export const useIsLocked = () => useAppSelector((state) => state.iphone.isLocked);

export const useBattery = () => useAppSelector((state) => state.iphone.battery);
export const useSystemStatus = () => useAppSelector((state) => ({
  battery: state.iphone.battery,
  isCharging: state.iphone.isCharging,
  signal: state.iphone.signal,
  wifi: state.iphone.wifi,
  bluetooth: state.iphone.bluetooth,
}));

// Main iPhone state hook
export function useIphoneState() {
  let dispatch: AppDispatch;
  let state: RootState['iphone'];

  try {
    dispatch = useDispatch<AppDispatch>();
    state = useSelector((state: RootState) => state.iphone);
  } catch (error) {
    console.error('iPhone state hook error - Provider not found:', error);
    
    // Return default state and no-op functions as fallback
    return {
      // Default state
      isLocked: true,
      passcode: '123456',
      biometricEnabled: true,
      currentApp: null,
      isAppOpen: false,
      backgroundApps: [],
      homeScreenPage: 0,
      apps: [],
      notifications: [],
      notificationBadges: {},
      battery: 87,
      isCharging: false,
      signal: 4,
      wifi: true,
      bluetooth: true,
      airplaneMode: false,
      dndMode: false,
      lowPowerMode: false,
      brightness: 80,
      volume: 70,
      isMuted: false,
      flashlight: false,
      wallpaper: "/wallpapers/default.jpg",
      theme: "dark" as const,
      dynamicIsland: true,
      controlCenterOpen: false,
      isReordering: false,
      swipeDirection: null,
      
      // No-op functions
      unlock: () => console.warn('iPhone Provider not available'),
      lock: () => console.warn('iPhone Provider not available'),
      openAppById: () => console.warn('iPhone Provider not available'),
      closeCurrentApp: () => console.warn('iPhone Provider not available'),
      goToHome: () => console.warn('iPhone Provider not available'),
      switchApp: () => console.warn('iPhone Provider not available'),
      closeBackgroundAppById: () => console.warn('iPhone Provider not available'),
      setPage: () => console.warn('iPhone Provider not available'),
      updatePosition: () => console.warn('iPhone Provider not available'),
      setAppReordering: () => console.warn('iPhone Provider not available'),
      addNotificationToApp: () => console.warn('iPhone Provider not available'),
      markNotificationAsRead: () => console.warn('iPhone Provider not available'),
      clearAppNotifications: () => console.warn('iPhone Provider not available'),
      updateBattery: () => console.warn('iPhone Provider not available'),
      updateCharging: () => console.warn('iPhone Provider not available'),
      updateSignal: () => console.warn('iPhone Provider not available'),
      updateWifi: () => console.warn('iPhone Provider not available'),
      updateBluetooth: () => console.warn('iPhone Provider not available'),
      updateAirplaneMode: () => console.warn('iPhone Provider not available'),
      updateDndMode: () => console.warn('iPhone Provider not available'),
      updateLowPowerMode: () => console.warn('iPhone Provider not available'),
      updateBrightness: () => console.warn('iPhone Provider not available'),
      updateVolume: () => console.warn('iPhone Provider not available'),
      updateMuted: () => console.warn('iPhone Provider not available'),
      toggleFlashlightState: () => console.warn('iPhone Provider not available'),
      updateWallpaper: () => console.warn('iPhone Provider not available'),
      updateTheme: () => console.warn('iPhone Provider not available'),
      updateDynamicIsland: () => console.warn('iPhone Provider not available'),
      toggleControlCenterState: () => console.warn('iPhone Provider not available'),
      closeControlCenterState: () => console.warn('iPhone Provider not available'),
      updateSwipeDirection: () => console.warn('iPhone Provider not available'),
    };
  }

  // Lock Screen Actions
  const unlock = useCallback(() => {
    dispatch(unlockPhone());
  }, [dispatch]);

  const lock = useCallback(() => {
    dispatch(lockPhone());
  }, [dispatch]);

  // App Management
  const openAppById = useCallback((appId: string) => {
    dispatch(openApp(appId));
  }, [dispatch]);

  const closeCurrentApp = useCallback(() => {
    dispatch(closeApp());
  }, [dispatch]);

  const goToHome = useCallback(() => {
    dispatch(goHome());
  }, [dispatch]);

  const switchApp = useCallback((appId: string) => {
    dispatch(switchToApp(appId));
  }, [dispatch]);

  const closeBackgroundAppById = useCallback((appId: string) => {
    dispatch(closeBackgroundApp(appId));
  }, [dispatch]);

  // Home Screen Management
  const setPage = useCallback((page: number) => {
    dispatch(setHomeScreenPage(page));
  }, [dispatch]);

  const updatePosition = useCallback((id: string, position: { x: number; y: number; page: number }) => {
    dispatch(updateAppPosition({ id, position }));
  }, [dispatch]);

  const setAppReordering = useCallback((isReordering: boolean) => {
    dispatch(setReordering(isReordering));
  }, [dispatch]);

  // Notifications
  const addNotificationToApp = useCallback((appId: string, title: string, body: string, type: 'banner' | 'alert' | 'badge' = 'banner') => {
    dispatch(addNotification({ appId, title, body, isRead: false, type }));
  }, [dispatch]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    dispatch(markNotificationRead(notificationId));
  }, [dispatch]);

  const clearAppNotifications = useCallback((appId: string) => {
    dispatch(clearNotifications(appId));
  }, [dispatch]);

  // System Status
  const updateBattery = useCallback((level: number) => {
    dispatch(setBattery(level));
  }, [dispatch]);

  const updateCharging = useCallback((isCharging: boolean) => {
    dispatch(setCharging(isCharging));
  }, [dispatch]);

  const updateSignal = useCallback((level: number) => {
    dispatch(setSignal(level));
  }, [dispatch]);

  const updateWifi = useCallback((enabled: boolean) => {
    dispatch(setWifi(enabled));
  }, [dispatch]);

  const updateBluetooth = useCallback((enabled: boolean) => {
    dispatch(setBluetooth(enabled));
  }, [dispatch]);

  const updateAirplaneMode = useCallback((enabled: boolean) => {
    dispatch(setAirplaneMode(enabled));
  }, [dispatch]);

  const updateDndMode = useCallback((enabled: boolean) => {
    dispatch(setDndMode(enabled));
  }, [dispatch]);

  const updateLowPowerMode = useCallback((enabled: boolean) => {
    dispatch(setLowPowerMode(enabled));
  }, [dispatch]);

  // Display & Audio
  const updateBrightness = useCallback((level: number) => {
    dispatch(setBrightness(level));
  }, [dispatch]);

  const updateVolume = useCallback((level: number) => {
    dispatch(setVolume(level));
  }, [dispatch]);

  const updateMuted = useCallback((muted: boolean) => {
    dispatch(setMuted(muted));
  }, [dispatch]);

  const toggleFlashlightState = useCallback(() => {
    dispatch(toggleFlashlight());
  }, [dispatch]);

  // Personalization
  const updateWallpaper = useCallback((wallpaperPath: string) => {
    dispatch(setWallpaper(wallpaperPath));
  }, [dispatch]);

  const updateTheme = useCallback((theme: "light" | "dark" | "auto") => {
    dispatch(setTheme(theme));
  }, [dispatch]);

  const updateDynamicIsland = useCallback((enabled: boolean) => {
    dispatch(setDynamicIsland(enabled));
  }, [dispatch]);

  // Control Center
  const toggleControlCenterState = useCallback(() => {
    dispatch(toggleControlCenter());
  }, [dispatch]);

  const closeControlCenterState = useCallback(() => {
    dispatch(closeControlCenter());
  }, [dispatch]);

  // Gestures
  const updateSwipeDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right' | null) => {
    dispatch(setSwipeDirection(direction));
  }, [dispatch]);

  return {
    // State
    ...state,
    
    // Actions
    unlock,
    lock,
    openAppById,
    closeCurrentApp,
    goToHome,
    switchApp,
    closeBackgroundAppById,
    setPage,
    updatePosition,
    setAppReordering,
    addNotificationToApp,
    markNotificationAsRead,
    clearAppNotifications,
    updateBattery,
    updateCharging,
    updateSignal,
    updateWifi,
    updateBluetooth,
    updateAirplaneMode,
    updateDndMode,
    updateLowPowerMode,
    updateBrightness,
    updateVolume,
    updateMuted,
    toggleFlashlightState,
    updateWallpaper,
    updateTheme,
    updateDynamicIsland,
    toggleControlCenterState,
    closeControlCenterState,
    updateSwipeDirection,
  };
}

// Hook for getting specific app information
export function useApp(appId: string) {
  try {
    const app = useSelector((state: RootState) => 
      state.iphone.apps.find(a => a.id === appId)
    );
    return app;
  } catch (error) {
    console.error('useApp hook error - Provider not found:', error);
    return undefined;
  }
}

// Hook for getting apps by page
export function useAppsByPage(page: number) {
  try {
    const apps = useSelector((state: RootState) => 
      state.iphone.apps.filter(a => a.position.page === page)
    );
    return apps;
  } catch (error) {
    console.error('useAppsByPage hook error - Provider not found:', error);
    return [];
  }
}

// Hook for getting dock apps (page -1)
export function useDockApps() {
  return useAppsByPage(-1);
}

// Hook for getting current page apps
export function useCurrentPageApps() {
  try {
    const currentPage = useSelector((state: RootState) => state.iphone.homeScreenPage);
    return useAppsByPage(currentPage);
  } catch (error) {
    console.error('useCurrentPageApps hook error - Provider not found:', error);
    return [];
  }
}

// Hook for notifications
export function useNotifications() {
  try {
    const notifications = useSelector((state: RootState) => state.iphone.notifications);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    return {
      notifications,
      unreadCount,
      hasUnread: unreadCount > 0,
    };
  } catch (error) {
    console.error('useNotifications hook error - Provider not found:', error);
    return {
      notifications: [],
      unreadCount: 0,
      hasUnread: false,
    };
  }
}

// Hook for audio/display settings
export function useAudioDisplay() {
  try {
    const audioDisplayState = useSelector((state: RootState) => ({
      brightness: state.iphone.brightness,
      volume: state.iphone.volume,
      isMuted: state.iphone.isMuted,
      flashlight: state.iphone.flashlight,
    }));
    
    return audioDisplayState;
  } catch (error) {
    console.error('useAudioDisplay hook error - Provider not found:', error);
    return {
      brightness: 80,
      volume: 70,
      isMuted: false,
      flashlight: false,
    };
  }
}

// Hook for theme/personalization
export function usePersonalization() {
  try {
    const personalizationState = useSelector((state: RootState) => ({
      wallpaper: state.iphone.wallpaper,
      theme: state.iphone.theme,
      dynamicIsland: state.iphone.dynamicIsland,
    }));
    
    return personalizationState;
  } catch (error) {
    console.error('usePersonalization hook error - Provider not found:', error);
    return {
      wallpaper: "/wallpapers/default.jpg",
      theme: "dark" as const,
      dynamicIsland: true,
    };
  }
}

// Hook for background apps
export function useBackgroundApps() {
  try {
    const backgroundAppIds = useSelector((state: RootState) => state.iphone.backgroundApps);
    const apps = useSelector((state: RootState) => state.iphone.apps);
    
    const backgroundApps = backgroundAppIds.map(id => 
      apps.find(app => app.id === id)
    ).filter(Boolean);
    
    return backgroundApps;
  } catch (error) {
    console.error('useBackgroundApps hook error - Provider not found:', error);
    return [];
  }
}

// Hook for getting total pages count
export function useTotalPages() {
  try {
    const apps = useSelector((state: RootState) => state.iphone.apps);
    const nonDockApps = apps.filter(app => app.position.page >= 0);
    const maxPage = Math.max(...nonDockApps.map(app => app.position.page), 0);
    
    return maxPage + 1;
  } catch (error) {
    console.error('useTotalPages hook error - Provider not found:', error);
    return 1;
  }
} 