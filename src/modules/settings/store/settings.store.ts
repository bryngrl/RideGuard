import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockSettings } from "../config/mock-data";
import type { Retention, ThemePreference } from "../types/settings.types";

interface SettingsState {
  isHydrated: boolean;
  retention: Retention;
  alertsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  locationInApp: boolean;
  locationWithContacts: boolean;
  themePreference: ThemePreference;
  searchHistory: string[];
  setRetention: (value: Retention) => void;
  setAlertsEnabled: (value: boolean) => void;
  setPushEnabled: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  setLocationInApp: (value: boolean) => void;
  setLocationWithContacts: (value: boolean) => void;
  setThemePreference: (value: ThemePreference) => void;
  addSearchHistory: (value: string) => void;
  clearSearchHistory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...mockSettings,
      isHydrated: false,
      // BACKEND SYNC: call updateRetention after persisting this value.
      setRetention: (retention) => set({ retention }),
      // BACKEND SYNC: call updateNotifications after persisting this value.
      setAlertsEnabled: (alertsEnabled) => set({ alertsEnabled }),
      // BACKEND SYNC: call updateNotifications after persisting this value.
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      // BACKEND SYNC: call updateNotifications after persisting this value.
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      // BACKEND SYNC: call updateNotifications after persisting this value.
      setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
      // BACKEND SYNC: call updateLocationSharing after persisting this value.
      setLocationInApp: (locationInApp) => set({ locationInApp }),
      // BACKEND SYNC: call updateLocationSharing after persisting this value.
      setLocationWithContacts: (locationWithContacts) =>
        set({ locationWithContacts }),
      // BACKEND SYNC: call updateTheme after persisting this value.
      setThemePreference: (themePreference) => set({ themePreference }),
      addSearchHistory: (value) =>
        set((state) => ({
          searchHistory: [
            value,
            ...state.searchHistory.filter((item) => item !== value),
          ].slice(0, 6),
        })),
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "rideguard-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () =>
        useSettingsStore.setState({ isHydrated: true }),
    },
  ),
);
