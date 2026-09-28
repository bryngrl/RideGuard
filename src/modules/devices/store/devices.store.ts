import { create } from "zustand";

export interface DeviceState {
  cameraDeviceId: string;
  isCameraActivated: boolean;

  setCameraDeviceId: (id: string) => void;
  setCameraActivated: (activated: boolean) => void;
  resetDevices: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  cameraDeviceId: "",
  isCameraActivated: false,

  setCameraDeviceId: (id: string) => set({ cameraDeviceId: id }),
  setCameraActivated: (activated: boolean) => set({ isCameraActivated: activated }),

  resetDevices: () =>
    set({
      cameraDeviceId: "",
      isCameraActivated: false,
    }),
}));
