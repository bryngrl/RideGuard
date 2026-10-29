import type { User } from "firebase/auth";
import { create } from "zustand";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { APIError } from "@/shared/api/errors";
import { getMyButtons, type LiveButton } from "../services/button-status.api";
import { useDeviceStore } from "./devices.store";

let generation = 0;
let pending: { uid: string; promise: Promise<void> } | null = null;
interface ButtonStatusState {
  uid: string | null;
  buttons: LiveButton[];
  loading: boolean;
  supported: boolean | null;
  error: string | null;
  load: (user: User) => Promise<void>;
  clear: () => void;
}

export const useButtonStatusStore = create<ButtonStatusState>((set, get) => ({
  uid: null, buttons: [], loading: false, supported: null, error: null,
  clear: () => { generation++; pending = null; set({ uid: null, buttons: [], loading: false, supported: null, error: null }); },
  load: (user) => {
    const uid = user.uid;
    if (useAuthStore.getState().user?.uid !== uid) return Promise.resolve();
    if (pending?.uid === uid) return pending.promise;
    const request = ++generation;
    const current = () => request === generation && useAuthStore.getState().user?.uid === uid;
    set({ uid, buttons: get().uid === uid ? get().buttons : [], loading: true, error: null });
    const promise = (async () => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          (async () => {
            if (!useDeviceStore.persist.hasHydrated()) await useDeviceStore.persist.rehydrate();
            const before = useDeviceStore.getState().buttonDeviceId;
            const token = await user.getIdToken();
            if (!current()) return null;
            return { before, buttons: await getMyButtons(token) };
          })(),
          new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => reject(new Error("Button status timed out")), 20_000); }),
        ]);
        if (!current() || !result) return;
        const devices = useDeviceStore.getState();
        // Inventory is authoritative, but an older in-flight request must not
        // overwrite a button that was just claimed by this installation.
        if (devices.ownerUid === uid && devices.buttonDeviceId === result.before) {
          const selected = result.buttons.find((button) => button.deviceId === result.before) ?? result.buttons[0];
          const id = selected?.deviceId ?? "";
          if (id !== devices.buttonDeviceId) devices.setButtonDeviceId(id);
        }
        set({ buttons: result.buttons, supported: true, error: null });
      } catch (error) {
        if (!current()) return;
        if (error instanceof APIError && error.status === 404) {
          set({ buttons: [], supported: false, error: null });
        } else {
          set({ error: "Couldn't load button status." });
        }
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
  if (state.user?.uid !== previous.user?.uid) useButtonStatusStore.getState().clear();
});
