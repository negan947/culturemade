import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
interface App {
  id: string;
  name: string;
  icon: string;
  component: string;
  position: { x: number; y: number; page: number };
  isSystem: boolean;
  badgeCount?: number;
  folder?: string | null;
}

interface Notification {
  id: string;
  appId: string;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  type: 'banner' | 'alert' | 'badge';
}

interface iPhoneState {
  // Lock Screen & Security
  isLocked: boolean;
  passcode: string;
  biometricEnabled: boolean;
  
  // App Management
  currentApp: string | null;
  isAppOpen: boolean;
  backgroundApps: string[];
  homeScreenPage: number;
  apps: App[];
  
  // Notifications
  notifications: Notification[];
  notificationBadges: Record<string, number>;
  
  // System Status
  battery: number;
  isCharging: boolean;
  signal: number;
  wifi: boolean;
  bluetooth: boolean;
  airplaneMode: boolean;
  dndMode: boolean;
  lowPowerMode: boolean;
  
  // Display & Audio
  brightness: number;
  volume: number;
  isMuted: boolean;
  flashlight: boolean;
  
  // Personalization
  wallpaper: string;
  theme: "light" | "dark" | "auto";
  dynamicIsland: boolean;
  
  // Control Center
  controlCenterOpen: boolean;
  
  // Gesture States
  isReordering: boolean;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | null;
}

const initialApps: App[] = [
  // System Apps (page -1 = dock)
  { id: 'phone', name: 'Phone', icon: '📞', component: 'PhoneApp', position: { x: 0, y: 0, page: -1 }, isSystem: true },
  { id: 'safari', name: 'Safari', icon: '🧭', component: 'SafariApp', position: { x: 1, y: 0, page: -1 }, isSystem: true },
  { id: 'messages', name: 'Messages', icon: '💬', component: 'MessagesApp', position: { x: 2, y: 0, page: -1 }, isSystem: true },
  { id: 'culturemade', name: 'CultureMade', icon: '🎨', component: 'CultureMadeApp', position: { x: 3, y: 0, page: -1 }, isSystem: false },
  
  // Home Screen Apps (page 0)
  { id: 'camera', name: 'Camera', icon: '📷', component: 'CameraApp', position: { x: 0, y: 0, page: 0 }, isSystem: true },
  { id: 'photos', name: 'Photos', icon: '🖼️', component: 'PhotosApp', position: { x: 1, y: 0, page: 0 }, isSystem: true },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: 'SettingsApp', position: { x: 2, y: 0, page: 0 }, isSystem: true },
  { id: 'calculator', name: 'Calculator', icon: '🧮', component: 'CalculatorApp', position: { x: 3, y: 0, page: 0 }, isSystem: true },
  { id: 'weather', name: 'Weather', icon: '🌤️', component: 'WeatherApp', position: { x: 0, y: 1, page: 0 }, isSystem: true },
  { id: 'clock', name: 'Clock', icon: '⏰', component: 'ClockApp', position: { x: 1, y: 1, page: 0 }, isSystem: true },
  { id: 'calendar', name: 'Calendar', icon: '📅', component: 'CalendarApp', position: { x: 2, y: 1, page: 0 }, isSystem: true },
  { id: 'notes', name: 'Notes', icon: '📝', component: 'NotesApp', position: { x: 3, y: 1, page: 0 }, isSystem: true },
  { id: 'music', name: 'Music', icon: '🎵', component: 'MusicApp', position: { x: 0, y: 2, page: 0 }, isSystem: true },
  { id: 'mail', name: 'Mail', icon: '📧', component: 'MailApp', position: { x: 1, y: 2, page: 0 }, isSystem: true },
  { id: 'appstore', name: 'App Store', icon: '🏪', component: 'AppStoreApp', position: { x: 2, y: 2, page: 0 }, isSystem: true },
];

// iPhone Slice
const iPhoneSlice = createSlice({
  name: "iphone",
  initialState: {
    // Lock Screen & Security
    isLocked: true,
    passcode: process.env.NEXT_PUBLIC_IPHONE_PASSCODE || "123456",
    biometricEnabled: true,
    
    // App Management
    currentApp: null,
    isAppOpen: false,
    backgroundApps: [],
    homeScreenPage: 0,
    apps: initialApps,
    
    // Notifications
    notifications: [],
    notificationBadges: {},
    
    // System Status
    battery: 87,
    isCharging: false,
    signal: 4,
    wifi: true,
    bluetooth: true,
    airplaneMode: false,
    dndMode: false,
    lowPowerMode: false,
    
    // Display & Audio
    brightness: 80,
    volume: 70,
    isMuted: false,
    flashlight: false,
    
    // Personalization
    wallpaper: "/wallpapers/default.jpg",
    theme: "dark" as const,
    dynamicIsland: true,
    
    // Control Center
    controlCenterOpen: false,
    
    // Gesture States
    isReordering: false,
    swipeDirection: null,
  } as iPhoneState,
  reducers: {
    // Lock Screen Actions
    unlockPhone: (state) => {
      state.isLocked = false;
    },
    lockPhone: (state) => {
      state.isLocked = true;
      state.currentApp = null;
      state.isAppOpen = false;
      state.controlCenterOpen = false;
    },
    
    // App Management
    openApp: (state, action: PayloadAction<string>) => {
      if (state.currentApp) {
        state.backgroundApps.push(state.currentApp);
      }
      state.currentApp = action.payload;
      state.isAppOpen = true;
      state.controlCenterOpen = false;
    },
    closeApp: (state) => {
      if (state.currentApp) {
        state.backgroundApps = state.backgroundApps.filter(id => id !== state.currentApp);
      }
      state.currentApp = null;
      state.isAppOpen = false;
    },
    goHome: (state) => {
      if (state.currentApp) {
        state.backgroundApps.push(state.currentApp);
      }
      state.currentApp = null;
      state.isAppOpen = false;
    },
    switchToApp: (state, action: PayloadAction<string>) => {
      const targetApp = action.payload;
      if (state.currentApp && state.currentApp !== targetApp) {
        state.backgroundApps.push(state.currentApp);
      }
      state.currentApp = targetApp;
      state.isAppOpen = true;
      state.backgroundApps = state.backgroundApps.filter(id => id !== targetApp);
    },
    closeBackgroundApp: (state, action: PayloadAction<string>) => {
      state.backgroundApps = state.backgroundApps.filter(id => id !== action.payload);
    },
    
    // Home Screen Management
    setHomeScreenPage: (state, action: PayloadAction<number>) => {
      state.homeScreenPage = action.payload;
    },
    updateAppPosition: (
      state,
      action: PayloadAction<{
        id: string;
        position: { x: number; y: number; page: number };
      }>
    ) => {
      const app = state.apps.find((a) => a.id === action.payload.id);
      if (app) app.position = action.payload.position;
    },
    setReordering: (state, action: PayloadAction<boolean>) => {
      state.isReordering = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.unshift(notification);
      
      // Update badge count
      const currentBadgeCount = state.notificationBadges[notification.appId] || 0;
      state.notificationBadges[notification.appId] = currentBadgeCount + 1;
      
      // Update app badge
      const app = state.apps.find(a => a.id === notification.appId);
      if (app) {
        app.badgeCount = state.notificationBadges[notification.appId];
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        const currentBadgeCount = state.notificationBadges[notification.appId] || 0;
        if (currentBadgeCount > 0) {
          state.notificationBadges[notification.appId] = currentBadgeCount - 1;
          
          // Update app badge
          const app = state.apps.find(a => a.id === notification.appId);
          if (app) {
            app.badgeCount = state.notificationBadges[notification.appId];
            if (app.badgeCount === 0) {
              delete app.badgeCount;
            }
          }
        }
      }
    },
    clearNotifications: (state, action: PayloadAction<string>) => {
      const appId = action.payload;
      state.notifications = state.notifications.filter(n => n.appId !== appId);
      delete state.notificationBadges[appId];
      
      // Clear app badge
      const app = state.apps.find(a => a.id === appId);
      if (app) {
        delete app.badgeCount;
      }
    },
    
    // System Status
    setBattery: (state, action: PayloadAction<number>) => {
      state.battery = Math.max(0, Math.min(100, action.payload));
    },
    setCharging: (state, action: PayloadAction<boolean>) => {
      state.isCharging = action.payload;
    },
    setSignal: (state, action: PayloadAction<number>) => {
      state.signal = Math.max(0, Math.min(4, action.payload));
    },
    setWifi: (state, action: PayloadAction<boolean>) => {
      state.wifi = action.payload;
    },
    setBluetooth: (state, action: PayloadAction<boolean>) => {
      state.bluetooth = action.payload;
    },
    setAirplaneMode: (state, action: PayloadAction<boolean>) => {
      state.airplaneMode = action.payload;
      if (action.payload) {
        state.wifi = false;
        state.bluetooth = false;
        state.signal = 0;
      }
    },
    setDndMode: (state, action: PayloadAction<boolean>) => {
      state.dndMode = action.payload;
    },
    setLowPowerMode: (state, action: PayloadAction<boolean>) => {
      state.lowPowerMode = action.payload;
    },
    
    // Display & Audio
    setBrightness: (state, action: PayloadAction<number>) => {
      state.brightness = Math.max(0, Math.min(100, action.payload));
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(100, action.payload));
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    toggleFlashlight: (state) => {
      state.flashlight = !state.flashlight;
    },
    
    // Personalization
    setWallpaper: (state, action: PayloadAction<string>) => {
      state.wallpaper = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark" | "auto">) => {
      state.theme = action.payload;
    },
    setDynamicIsland: (state, action: PayloadAction<boolean>) => {
      state.dynamicIsland = action.payload;
    },
    
    // Control Center
    toggleControlCenter: (state) => {
      state.controlCenterOpen = !state.controlCenterOpen;
    },
    closeControlCenter: (state) => {
      state.controlCenterOpen = false;
    },
    
    // Gestures
    setSwipeDirection: (state, action: PayloadAction<'up' | 'down' | 'left' | 'right' | null>) => {
      state.swipeDirection = action.payload;
    },
  },
});

// Export actions
export const {
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
} = iPhoneSlice.actions;

// Configure store
export const iPhoneStore = configureStore({
  reducer: {
    iphone: iPhoneSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['iphone/addNotification'],
      },
    }),
});

// Types
export type RootState = ReturnType<typeof iPhoneStore.getState>;
export type AppDispatch = typeof iPhoneStore.dispatch;

// Export types
export type { App, Notification, iPhoneState }; 