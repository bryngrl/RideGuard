import { create } from "zustand";

import type { AuthState, AuthUser } from "../types/auth.types";

interface AuthStore extends AuthState {
  isCheckingAuth: boolean;
  isOldUser: boolean | null;

  setUser: (user: AuthUser | null) => void;
  setCheckingAuth: (isCheckingAuth: boolean) => void;
  setIsOldUser: (isOldUser: boolean | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  isOldUser: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  setCheckingAuth: (isCheckingAuth) =>
    set({
      isCheckingAuth,
    }),

  setIsOldUser: (isOldUser) =>
    set({
      isOldUser,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
      isOldUser: null,
    }),
}));