import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { mockSettings } from "../config/mock-data";
import { settingsRows } from "../config/settings-rows";
import { getAutoArchive, updateAutoArchive } from "../services/settings.api";
import type { AutoArchiveHours, ThemePreference } from "../types/settings.types";

// Tracks the auto-archive request lifecycle so the screen can show saving /
// error / retry without pretending an unsaved value stuck.
export type AutoArchiveStatus = "idle" | "loading" | "saving" | "error";

interface SettingsState {
  isHydrated: boolean;
  autoArchiveHours: AutoArchiveHours;
  autoArchiveStatus: AutoArchiveStatus;
  alertsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  locationInApp: boolean;
  locationWithContacts: boolean;
  themePreference: ThemePreference;
  searchHistory: string[];
  loadAutoArchive: () => Promise<void>;
  saveAutoArchive: (value: AutoArchiveHours) => Promise<boolean>;
  resetAutoArchive: () => void;
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

async function currentToken(): Promise<string | null> {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...mockSettings,
      autoArchiveStatus: "idle",
      isHydrated: false,

      // Hydrate the preference from the server (source of truth). Called on
      // login and when the Auto archive screen opens.
      loadAutoArchive: async () => {
        const token = await currentToken();
        if (!token) return;
        set({ autoArchiveStatus: "loading" });
        try {
          const hours = await getAutoArchive(token);
          set({ autoArchiveHours: hours, autoArchiveStatus: "idle" });
        } catch (error) {
          console.error("Failed to load auto-archive preference:", error);
          set({ autoArchiveStatus: "error" });
        }
      },

      // Persist to the server first; only reflect the new value after it saves.
      // Returns whether the save succeeded so the screen can surface a retry.
      saveAutoArchive: async (value) => {
        const token = await currentToken();
        if (!token) {
          set({ autoArchiveStatus: "error" });
          return false;
        }
        set({ autoArchiveStatus: "saving" });
        try {
          const saved = await updateAutoArchive(value, token);
          set({ autoArchiveHours: saved, autoArchiveStatus: "idle" });
          return true;
        } catch (error) {
          console.error("Failed to save auto-archive preference:", error);
          set({ autoArchiveStatus: "error" });
          return false;
        }
      },

      // Clear account-specific preference state on logout / account change.
      resetAutoArchive: () =>
        set({ autoArchiveHours: null, autoArchiveStatus: "idle" }),

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
      // Persist the selected appearance on this device.
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
      version: 1,
      migrate: (persisted, version) => {
        const saved = persisted && typeof persisted === "object" ? persisted as Partial<SettingsState> : {};
        // The former default (system) was saved even when no choice was made.
        return version < 1 && saved.themePreference === "system"
          ? { ...saved, themePreference: "light" }
          : saved;
      },
      merge: (persisted, current) => {
        const saved = persisted && typeof persisted === "object" ? persisted as Partial<SettingsState> : {};
        const themePreference = saved.themePreference;
        return {
          ...current,
          ...saved,
          themePreference: themePreference === "light" || themePreference === "dark" || themePreference === "system"
            ? themePreference
            : "light",
          isHydrated: false,
        };
      },
      onRehydrateStorage: () => () =>
        useSettingsStore.setState({ isHydrated: true }),
    },
  ),
);
