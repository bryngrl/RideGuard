import { create } from "zustand";

// Memory-only confirmation; neither passwords nor authentication grants live here.
export const usePasswordChangeResult = create<{ completed: boolean; confirm: () => void; clear: () => void }>((set) => ({
  completed: false, confirm: () => set({ completed: true }), clear: () => set({ completed: false }),
}));
