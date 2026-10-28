import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "@/modules/auth/store/auth.store";

const emptyDevices = {
  camera1DeviceId: "", camera2DeviceId: "", buttonDeviceId: "",
  isCamera1Activated: false, isCamera2Activated: false, isButtonActivated: false,
};
type SavedDevices = typeof emptyDevices;
function snapshot(state: SavedDevices): SavedDevices {
  return Object.fromEntries(Object.keys(emptyDevices).map((key) => [key, state[key as keyof SavedDevices]])) as SavedDevices;
}

export interface DeviceState {
  ownerUid: string | null;
  devicesByOwner: Record<string, SavedDevices>;
  setOwner: (uid: string | null) => void;
  camera1DeviceId: string;
  camera2DeviceId: string;
  buttonDeviceId: string;

  isCamera1Activated: boolean;
  isCamera2Activated: boolean;
  isButtonActivated: boolean;

  setCamera1DeviceId: (id: string) => void;
  setCamera2DeviceId: (id: string) => void;
  setButtonDeviceId: (id: string) => void;

  setCamera1Activated: (activated: boolean) => void;
  setCamera2Activated: (activated: boolean) => void;
  setButtonActivated: (activated: boolean) => void;

  resetDevices: () => void;
  clearDisconnectedDevice: (ownerUid: string, deviceId: string) => boolean;
}
export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      ownerUid: null,
      devicesByOwner: {},
      setOwner: (ownerUid) => set((current) => {
        if (current.ownerUid === ownerUid) return current;
        const devicesByOwner = { ...current.devicesByOwner };
        // Preserve the pre-migration installation's device IDs for its first
        // authenticated owner; later sign-ins always use their own snapshot.
        const legacy = current.ownerUid === null && Object.keys(devicesByOwner).length === 0;
        if (current.ownerUid) devicesByOwner[current.ownerUid] = snapshot(current);
        const saved = ownerUid && Object.hasOwn(devicesByOwner, ownerUid) ? devicesByOwner[ownerUid] : null;
        return { ...(saved ?? (ownerUid && legacy ? snapshot(current) : emptyDevices)), ownerUid, devicesByOwner };
      }),
      camera1DeviceId: "",
      camera2DeviceId: "",
      buttonDeviceId: "",

      isCamera1Activated: false,
      isCamera2Activated: false,
      isButtonActivated: false,

      setCamera1DeviceId: (id: string) => set({ camera1DeviceId: id }),
      setCamera2DeviceId: (id: string) => set({ camera2DeviceId: id }),
      setButtonDeviceId: (id: string) => set({ buttonDeviceId: id }),

      setCamera1Activated: (activated: boolean) =>
        set({ isCamera1Activated: activated }),
      setCamera2Activated: (activated: boolean) =>
        set({ isCamera2Activated: activated }),
      setButtonActivated: (activated: boolean) =>
        set({ isButtonActivated: activated }),

      clearDisconnectedDevice: (ownerUid, deviceId) => {
        const current = get();
        if (!deviceId || current.ownerUid !== ownerUid ||
          ![current.camera1DeviceId, current.camera2DeviceId, current.buttonDeviceId].includes(deviceId)) return false;
        const next = { ...snapshot(current),
          ...(current.camera1DeviceId === deviceId && { camera1DeviceId: "", isCamera1Activated: false }),
          ...(current.camera2DeviceId === deviceId && { camera2DeviceId: "", isCamera2Activated: false }),
          ...(current.buttonDeviceId === deviceId && { buttonDeviceId: "", isButtonActivated: false }),
        };
        set({ ...next, devicesByOwner: { ...current.devicesByOwner, [ownerUid]: next } });
        return true;
      },

      resetDevices: () =>
        set({
          camera1DeviceId: "",
          camera2DeviceId: "",
          buttonDeviceId: "",
          isCamera1Activated: false,
          isCamera2Activated: false,
          isButtonActivated: false,
        }),
    }),
    {
      name: "rideguard-devices",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

function syncDeviceOwner() {
  const { user, isCheckingAuth } = useAuthStore.getState();
  if (!isCheckingAuth && useDeviceStore.persist.hasHydrated()) useDeviceStore.getState().setOwner(user?.uid ?? null);
}
useAuthStore.subscribe(syncDeviceOwner);
useDeviceStore.persist.onFinishHydration(syncDeviceOwner);
syncDeviceOwner();
