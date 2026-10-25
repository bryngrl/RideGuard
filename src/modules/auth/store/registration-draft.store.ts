import { create } from "zustand";

type RegistrationDraft = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  created: { username: string; email: string } | null;
  resendAt: number;
  deliveryFailed: boolean;
  update: (draft: Partial<Omit<RegistrationDraft, "update" | "clear">>) => void;
  clear: () => void;
};

const empty = { username: "", email: "", password: "", confirmPassword: "", created: null, resendAt: 0, deliveryFailed: false };

// Memory only: passwords must never enter route parameters or device storage.
export const useRegistrationDraft = create<RegistrationDraft>((set) => ({
  ...empty,
  update: (draft) => set(draft),
  clear: () => set(empty),
}));
