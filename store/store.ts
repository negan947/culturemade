import { configureStore } from "@reduxjs/toolkit";
import interfaceSlice from "./interface-slice";
import notificationSlice from "./notification-slice";

export const store = configureStore({
  reducer: {
    interface: interfaceSlice,
    notification: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notification/addNotification'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 