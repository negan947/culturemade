import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Interface {
  appId: string | null;
  inApp: boolean;
  statusBarColor: "light" | "dark";
  isLocked: boolean;
}

const initialState: Interface = {
  appId: null,
  inApp: false,
  statusBarColor: "dark", // Default to dark text for light backgrounds
  isLocked: true, // Start with lockscreen
};

export const interfaceSlice = createSlice({
  name: "interface",
  initialState,
  reducers: {
    changeCurrentApp: (state, action: PayloadAction<string>) => {
      state.appId = action.payload;
      state.inApp = true;
    },
    exitApp: (state) => {
      state.appId = null;
      state.inApp = false;
      state.statusBarColor = "dark";
    },
    changeStatusBarColor: (state, action: PayloadAction<"light" | "dark">) => {
      state.statusBarColor = action.payload;
    },
    unlock: (state) => {
      state.isLocked = false;
    },
    lock: (state) => {
      state.isLocked = true;
      state.appId = null;
      state.inApp = false;
      state.statusBarColor = "dark";
    },
  },
});

export const interfaceActions = interfaceSlice.actions;

export default interfaceSlice.reducer; 