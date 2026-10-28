import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LoadingList = "contacts" | "alerts:active" | "alerts:unread" | "alerts:archived";
type Counts = Record<string, Partial<Record<LoadingList, number>>>;
interface LoadingCountsState {
  counts: Counts;
  remember: (uid: string, list: LoadingList, count: number) => void;
}

/** Only numeric counts are saved, never contact details, photos or alert content. */
export const useLoadingCountsStore = create<LoadingCountsState>()(persist((set) => ({
  counts: {},
  remember: (uid, list, count) => {
    if (!uid || !Number.isInteger(count) || count < 0) return;
    set((state) => state.counts[uid]?.[list] === count ? state : {
      counts: { ...state.counts, [uid]: { ...state.counts[uid], [list]: count } },
    });
  },
}), {
  name: "rideguard-loading-counts",
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ counts: state.counts }),
  merge: (saved, current) => {
    const counts = (saved as Partial<LoadingCountsState> | null)?.counts;
    return { ...current, counts: counts && typeof counts === "object" && !Array.isArray(counts) ? counts : {} };
  },
}));
