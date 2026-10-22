import { create } from "zustand";

import type { VerifiedResetSession } from "../services/password-recovery";

type ResetSession = VerifiedResetSession & { destination: string };

export function isResetSessionValid(
  session: VerifiedResetSession | null,
  now = Date.now(),
): session is VerifiedResetSession {
  return !!session && typeof session.resetToken === "string" &&
    session.resetToken.trim().length > 0 &&
    Number.isFinite(session.expiresAt) && session.expiresAt > now;
}

interface PasswordRecoveryStore {
  session: ResetSession | null;
  completed: boolean;
  setVerifiedSession: (destination: string, session: VerifiedResetSession) => boolean;
  complete: (resetToken: string) => boolean;
  clear: () => void;
}

// Intentionally memory-only: never persist reset tokens or put them in route params.
export const usePasswordRecoveryStore = create<PasswordRecoveryStore>((set, get) => ({
  session: null,
  completed: false,
  setVerifiedSession: (destination, session) => {
    if (!isResetSessionValid(session)) {
      set({ session: null, completed: false });
      return false;
    }
    set({ session: { ...session, destination }, completed: false });
    return true;
  },
  // Called only after the password update service explicitly confirms success.
  complete: (resetToken) => {
    if (get().session?.resetToken !== resetToken) return false;
    set({ session: null, completed: true });
    return true;
  },
  clear: () => set({ session: null, completed: false }),
}));
