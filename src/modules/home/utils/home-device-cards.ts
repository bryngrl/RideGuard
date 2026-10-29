import type { LiveCamera } from "@/modules/camera-sensor/types/live-camera.types";
import { devicePresence } from "@/modules/devices/utils/device-presence";

/** Match Camera Preview's external-camera ordering and backend presence. */
export function homeDeviceCards(status: { cameras: LiveCamera[]; isLoading: boolean; error: string | null },
  saved: { camera1DeviceId: string; camera2DeviceId: string; buttonDeviceId: string }) {
  const external = status.cameras.filter((camera) => camera.source !== "phone");
  const confirmed = !status.isLoading && !status.error;
  const camera = (index: number, cachedId: string) => {
    const deviceId = confirmed ? external[index]?.deviceId ?? "" : external[index]?.deviceId ?? cachedId;
    return { deviceId, ...devicePresence({ type: "camera", deviceId }, status) };
  };
  return {
    camera1: camera(0, saved.camera1DeviceId),
    camera2: camera(1, saved.camera2DeviceId),
    button: { deviceId: saved.buttonDeviceId, ...devicePresence({ type: "button", deviceId: saved.buttonDeviceId }, status) },
  };
}
