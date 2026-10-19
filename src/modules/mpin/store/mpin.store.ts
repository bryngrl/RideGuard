import { create } from "zustand";

import type { MpinAuthorization, MpinDelivery, MpinMode, MpinStatus } from "../services/mpin.api";
import { isCompleteMpin, localDeadline, safeReturnPath, validAuthorization, validDelivery, validMpinStatus } from "../utils/mpin-policy";

interface MpinStore {
  owner: string | null;
  status: MpinStatus | null;
  unlocked: boolean;
  checkingStatus: boolean;
  draft: { pin: string; mode: MpinMode } | null;
  authorization: (MpinAuthorization & { mode: "change" | "reset" }) | null;
  delivery: (MpinDelivery & { mode: "change" | "reset" }) | null;
  success: MpinMode | null;
  generation: number;
  statusVersion: number;
  returnTo: string;
  setOwner: (owner: string | null) => void;
  setStatus: (owner: string, status: MpinStatus) => boolean;
  beginStatusCheck: () => void;
  failStatusCheck: () => void;
  setDraft: (pin: string, mode: MpinMode) => boolean;
  setAuthorization: (value: MpinAuthorization, mode: "change" | "reset") => boolean;
  setDelivery: (value: MpinDelivery, mode?: "change" | "reset") => boolean;
  acceptUnlock: (owner: string) => boolean;
  complete: (owner: string, mode: MpinMode) => boolean;
  setReturnTo: (path: string) => void;
  clearFlow: () => void;
  clearDraft: () => void;
  invalidateAuthorization: () => void;
  invalidateStatus: () => void;
  lock: () => void;
  reset: () => void;
}

const initial = {
  owner: null, status: null, unlocked: false, checkingStatus: false, draft: null, authorization: null,
  delivery: null, success: null, generation: 0, statusVersion: 0, returnTo: "/",
};

// Memory only. No PIN, draft, grant, or unlock state is persisted to storage.
export const useMpinStore = create<MpinStore>((set, get) => ({
  ...initial,
  setOwner: (owner) => {
    if (owner !== get().owner) set({ ...initial, owner, generation: get().generation + 1, statusVersion: get().statusVersion + 1 });
  },
  setStatus: (owner, status) => {
    if (owner !== get().owner || !validMpinStatus(status)) return false;
    const normalized = { ...status, serverTime: undefined,
      unlockExpiresAt: status.unlockExpiresAt === undefined ? undefined : localDeadline(status.unlockExpiresAt, status.serverTime),
      lockedUntil: status.lockedUntil === undefined ? undefined : localDeadline(status.lockedUntil, status.serverTime) };
    set({ status: normalized, checkingStatus: false, statusVersion: get().statusVersion + 1,
      unlocked: status.configured && !status.requiresUnlock && !status.locked && status.remainingAttempts !== 0 &&
        (normalized.unlockExpiresAt === undefined || normalized.unlockExpiresAt > Date.now()) });
    return true;
  },
  beginStatusCheck: () => set({ checkingStatus: true }),
  failStatusCheck: () => set({ checkingStatus: false, unlocked: false, status: null, statusVersion: get().statusVersion + 1 }),
  setDraft: (pin, mode) => {
    if (!get().owner || !isCompleteMpin(pin)) return false;
    set({ draft: { pin, mode }, success: null });
    return true;
  },
  setAuthorization: (value, mode) => {
    if (!get().owner || !validAuthorization(value)) return false;
    set({ authorization: { ...value, expiresAt: localDeadline(value.expiresAt, value.serverTime), serverTime: undefined, mode },
      delivery: null, draft: null, success: null });
    return true;
  },
  setDelivery: (value, mode = "reset") => {
    if (!get().owner || !validDelivery(value)) return false;
    set({ delivery: { ...value, mode, expiresAt: localDeadline(value.expiresAt, value.serverTime),
      resendAt: localDeadline(value.resendAt, value.serverTime), serverTime: undefined }, authorization: null, draft: null });
    return true;
  },
  acceptUnlock: (owner) => {
    if (owner !== get().owner || !get().status?.configured || !get().unlocked) return false;
    set({ draft: null, authorization: null, delivery: null });
    return true;
  },
  // Call only after an explicit server success. A local PIN match is insufficient.
  complete: (owner, mode) => {
    if (owner !== get().owner) return false;
    // Saving a PIN does not prove an unlocked session. Continue rechecks status.
    set({ status: null, unlocked: false, checkingStatus: false, statusVersion: get().statusVersion + 1,
      draft: null, authorization: null, delivery: null, success: mode, generation: get().generation + 1 });
    return true;
  },
  setReturnTo: (path) => set({ returnTo: safeReturnPath(path) }),
  clearDraft: () => set({ draft: null }),
  invalidateAuthorization: () => set({ authorization: null, draft: null, delivery: null, generation: get().generation + 1 }),
  invalidateStatus: () => set({ status: null, draft: null, unlocked: false, checkingStatus: false, statusVersion: get().statusVersion + 1 }),
  lock: () => {
    set({ unlocked: false, checkingStatus: false, statusVersion: get().statusVersion + 1,
      status: get().status ? { ...get().status!, requiresUnlock: true } : null, draft: null, authorization: null,
      delivery: null, success: null, generation: get().generation + 1 });
  },
  clearFlow: () => set({ draft: null, authorization: null, delivery: null, success: null, generation: get().generation + 1 }),
  reset: () => set({ ...initial, generation: get().generation + 1, statusVersion: get().statusVersion + 1 }),
}));
