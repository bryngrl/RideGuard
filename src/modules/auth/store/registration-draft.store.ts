import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

type RegistrationDraft = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  created: { username: string; email: string } | null;
  resendAt: number;
  deliveryFailed: boolean;
  verificationEmail: string | null;
  update: (draft: Partial<Omit<RegistrationDraft, "update" | "clear">>) => void;
  clear: () => void;
};

const empty = { username: "", email: "", password: "", confirmPassword: "", created: null, resendAt: 0, deliveryFailed: false, verificationEmail: null };

// Persist only the public checkpoint. Passwords remain memory-only.
export const useRegistrationDraft = create<RegistrationDraft>()(persist((set) => ({
  ...empty,
  update: (draft) => set(draft),
  clear: () => set(empty),
}), {
  name: "rideguard-email-verification",
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ username: state.username, email: state.email, created: state.created,
    resendAt: state.resendAt, deliveryFailed: state.deliveryFailed, verificationEmail: state.verificationEmail }),
}));
