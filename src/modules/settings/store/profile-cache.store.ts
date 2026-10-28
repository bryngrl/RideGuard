import type { User } from "firebase/auth";
import { create } from "zustand";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { SettingsProfile } from "../types/settings.types";
import { getProfile, type ProfileDocument } from "../services/profile.api";

const CACHE_MS = 5 * 60 * 1000;
const RETRY_MS = 30 * 1000;
let requestNumber = 0;
let inFlight: { uid: string; promise: Promise<void> } | null = null;

interface ProfileCacheState {
  uid: string | null;
  document: ProfileDocument | null;
  fetchedAt: number;
  attemptedAt: number;
  loading: boolean;
  failed: boolean;
  load: (user: User, force?: boolean) => Promise<void>;
  updateDetails: (uid: string, profile: Omit<SettingsProfile, "photoUrl">) => void;
  setPhotoUrl: (uid: string, url: string) => void;
  clear: () => void;
}

export const useProfileCacheStore = create<ProfileCacheState>((set, get) => ({
  uid: null,
  document: null,
  fetchedAt: 0,
  attemptedAt: 0,
  loading: false,
  failed: false,
  clear: () => {
    requestNumber++;
    inFlight = null;
    set({ uid: null, document: null, fetchedAt: 0, attemptedAt: 0, loading: false, failed: false });
  },
  load: (user, force = false) => {
    const uid = user.uid;
    const current = get();
    if (inFlight?.uid === uid) return inFlight.promise;
    if (!force && current.uid === uid && (
      current.fetchedAt && Date.now() - current.fetchedAt < CACHE_MS ||
      current.failed && Date.now() - current.attemptedAt < RETRY_MS
    )) return Promise.resolve();

    const request = ++requestNumber;
    const sameUser = current.uid === uid;
    set({
      uid,
      document: sameUser ? current.document : null,
      fetchedAt: sameUser ? current.fetchedAt : 0,
      attemptedAt: Date.now(),
      loading: true,
      failed: false,
    });
    const promise = (async () => {
      try {
        const token = await user.getIdToken();
        const document = await getProfile(token);
        if (request !== requestNumber || useAuthStore.getState().user?.uid !== uid) return;
        set({ document, fetchedAt: Date.now(), failed: false });
      } catch {
        if (request === requestNumber && useAuthStore.getState().user?.uid === uid) {
          // Keep the last valid profile during a temporary outage.
          set({ failed: true });
        }
      } finally {
        if (request === requestNumber) {
          set({ loading: false });
          inFlight = null;
        }
      }
    })();
    inFlight = { uid, promise };
    return promise;
  },
  updateDetails: (uid, profile) => set((current) => {
    if (current.uid !== uid) return current;
    requestNumber++;
    inFlight = null;
    return {
      document: {
        ...current.document,
        personalInfo: {
          ...current.document?.personalInfo,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phone,
        },
        vehicle: {
          ...current.document?.vehicle,
          brand: profile.vehicleBrand,
          model: profile.vehicleModel,
          plateNumber: profile.plateNumber,
        },
      },
      fetchedAt: Date.now(),
      loading: false,
      failed: false,
    };
  }),
  setPhotoUrl: (uid, url) => set((current) => {
    if (current.uid !== uid) return current;
    requestNumber++;
    inFlight = null;
    return {
      document: { ...current.document, photo_url: url },
      fetchedAt: current.document ? current.fetchedAt : 0,
      loading: false,
      failed: false,
    };
  }),
}));

// Drop cached account data immediately when Firebase changes users or signs out.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid !== previous.user?.uid) useProfileCacheStore.getState().clear();
});
