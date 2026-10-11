import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Retention, SettingTheme } from "../constants";

interface SettingsState {
  retention: Retention;
  alertsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  locationSharing: boolean;
  themePreference: SettingTheme;
  searchHistory: string[];
  setRetention: (value: Retention) => void;
  setAlertsEnabled: (value: boolean) => void;
  setPushEnabled: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  setLocationSharing: (value: boolean) => void;
  setThemePreference: (value: SettingTheme) => void;
  addSearchHistory: (value: string) => void;
  clearSearchHistory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      retention: 48,
      alertsEnabled: true,
      pushEnabled: true,
      soundEnabled: false,
      vibrationEnabled: false,
      locationSharing: false,
      themePreference: "system",
      searchHistory: [],
      setRetention: (retention) => set({ retention }),
      setAlertsEnabled: (alertsEnabled) => set({ alertsEnabled }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
      setLocationSharing: (locationSharing) => set({ locationSharing }),
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
    },
  ),
);

