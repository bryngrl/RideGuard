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

let autoArchiveRevision = 0;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...mockSettings,
      autoArchiveStatus: "idle",
      isHydrated: false,

      // Hydrate the preference from the server (source of truth). Called on
      // login and when the Auto archive screen opens.
      loadAutoArchive: async () => {
        if (get().autoArchiveStatus === "saving") return;
        const user = useAuthStore.getState().user;
        if (!user) return;
        const revision = ++autoArchiveRevision;
        const current = () => revision === autoArchiveRevision && useAuthStore.getState().user?.uid === user.uid;
        set({ autoArchiveStatus: "loading" });
        try {
          const token = await user.getIdToken();
          if (!current()) return;
          const hours = await getAutoArchive(token);
          if (current()) set({ autoArchiveHours: hours, autoArchiveStatus: "idle" });
        } catch (error) {
          if (current()) {
            console.warn("Auto-archive preference unavailable. Retry in Settings.");
            set({ autoArchiveStatus: "error" });
          }
        }
      },

      // Persist to the server first; only reflect the new value after it saves.
      // Returns whether the save succeeded so the screen can surface a retry.
      saveAutoArchive: async (value) => {
        if (get().autoArchiveStatus === "saving") return false;
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ autoArchiveStatus: "error" });
          return false;
        }
        const revision = ++autoArchiveRevision;
        const current = () => revision === autoArchiveRevision && useAuthStore.getState().user?.uid === user.uid;
        set({ autoArchiveStatus: "saving" });
        try {
          const token = await user.getIdToken();
          if (!current()) return false;
          const saved = await updateAutoArchive(value, token);
          if (!current()) return false;
          set({ autoArchiveHours: saved, autoArchiveStatus: "idle" });
          return true;
        } catch (error) {
          if (current()) {
            console.warn("Auto-archive preference was not saved. Retry in Settings.");
            set({ autoArchiveStatus: "error" });
          }
          return false;
        }
      },

      // Clear account-specific preference state on logout / account change.
      resetAutoArchive: () => {
        autoArchiveRevision++;
        set({ autoArchiveHours: 24, autoArchiveStatus: "idle" });
      },

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

// Firebase can change accounts outside the explicit logout button as well.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid !== previous.user?.uid) useSettingsStore.getState().resetAutoArchive();
});
