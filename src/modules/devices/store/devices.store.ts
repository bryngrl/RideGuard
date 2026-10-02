import { create } from "zustand";

export interface DeviceState {
  metalDeviceId: string;
  cameraDeviceId: string;
  isMetalActivated: boolean;
  isCameraActivated: boolean;

  setMetalDeviceId: (id: string) => void;
  setCameraDeviceId: (id: string) => void;
  setMetalActivated: (activated: boolean) => void;
  setCameraActivated: (activated: boolean) => void;
  resetDevices: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  metalDeviceId: "",
  cameraDeviceId: "",
  isMetalActivated: false,
  isCameraActivated: false,

  setMetalDeviceId: (id: string) => set({ metalDeviceId: id }),
  setCameraDeviceId: (id: string) => set({ cameraDeviceId: id }),
  setMetalActivated: (activated: boolean) => set({ isMetalActivated: activated }),
  setCameraActivated: (activated: boolean) => set({ isCameraActivated: activated }),

  resetDevices: () =>
    set({
      metalDeviceId: "",
      cameraDeviceId: "",
      isMetalActivated: false,
      isCameraActivated: false,
    }),
}));
