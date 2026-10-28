import type { User } from "firebase/auth";
import { create } from "zustand";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { getMyCameras } from "../services/cameras.api";
import type { LiveCamera } from "../types/live-camera.types";

let generation = 0;
let pending: { uid: string; promise: Promise<void> } | null = null;
interface CameraStatusState {
  uid: string | null; cameras: LiveCamera[]; loading: boolean; error: string | null;
  load: (user: User) => Promise<void>; clear: () => void;
}

/** One account-scoped GET /devices/cameras result for Home and Camera Preview. */
export const useCameraStatusStore = create<CameraStatusState>((set, get) => ({
  uid: null, cameras: [], loading: false, error: null,
  clear: () => { generation++; pending = null; set({ uid: null, cameras: [], loading: false, error: null }); },
  load: (user) => {
    const uid = user.uid;
    if (useAuthStore.getState().user?.uid !== uid) return Promise.resolve();
    if (pending?.uid === uid) return pending.promise;
    const request = ++generation;
    const current = () => request === generation && useAuthStore.getState().user?.uid === uid;
    set({ uid, cameras: get().uid === uid ? get().cameras : [], loading: true, error: null });
    const promise = (async () => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const cameras = await Promise.race([
          (async () => {
            const token = await user.getIdToken();
            if (!current()) return [];
            return getMyCameras(token);
          })(),
          new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => reject(new Error("Camera status timed out")), 20_000); }),
        ]);
        if (current()) set({ cameras, error: null });
      } catch {
        if (current()) set({ error: "Couldn't load cameras." });
      } finally {
        clearTimeout(timeout);
        if (current()) { pending = null; set({ loading: false }); }
      }
    })();
    pending = { uid, promise };
    return promise;
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid !== previous.user?.uid) useCameraStatusStore.getState().clear();
});
