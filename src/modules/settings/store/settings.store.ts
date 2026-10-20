import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockSettings } from "../config/mock-data";
import type { Retention, ThemePreference } from "../types/settings.types";
import { settingsRows } from "../config/settings-rows";

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
        set((state) => {
          // Only known menu titles may be saved; never retain free-form input.
          const title = settingsRows.find((row) => row.title === value)?.title;
          if (!title) return state;
          return { searchHistory: [title, ...state.searchHistory.filter((item) => item !== title)].slice(0, 6) };
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "rideguard-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted && typeof persisted === "object" ? persisted as Partial<SettingsState> : {};
        const themePreference = saved.themePreference;
        return {
          ...current,
          ...saved,
          themePreference: themePreference === "light" || themePreference === "dark" || themePreference === "system"
            ? themePreference
            : "system",
          isHydrated: false,
        };
      },
      onRehydrateStorage: () => () =>
        useSettingsStore.setState({ isHydrated: true }),
    },
  ),
);
