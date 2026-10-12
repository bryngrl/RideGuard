import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface DeviceState {
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
}
export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
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
