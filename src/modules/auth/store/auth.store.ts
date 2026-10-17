import { create } from "zustand";

import type { AuthState, AuthUser } from "../types/auth.types";

interface AuthStore extends AuthState {
  isCheckingAuth: boolean;
  isOldUser: boolean | null;
  isDemo: boolean;

  startDemo: () => void;
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
  isDemo: false,

  startDemo: () =>
    set({
      user: null,
      isDemo: true,
      isAuthenticated: true,
      isCheckingAuth: false,
      isOldUser: true,
    }),

  setUser: (user) =>
    set((state) => ({
      user,
      isDemo: user ? false : state.isDemo,
      isAuthenticated: user !== null || state.isDemo,
    })),

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
      isDemo: false,
    }),
}));
