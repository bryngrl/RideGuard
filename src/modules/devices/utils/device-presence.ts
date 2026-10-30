import type { LiveCamera } from "@/modules/camera-sensor/types/live-camera.types";
import type { LiveButton } from "../services/button-status.api";

export interface DevicePresenceSnapshot {
  cameras: LiveCamera[]; isLoading: boolean; error: string | null;
  buttons?: LiveButton[]; buttonsLoading?: boolean;
  buttonsSupported?: boolean | null; buttonsError?: string | null;
}

export function devicePresence(device: { type: "camera" | "button"; deviceId: string },
  status: DevicePresenceSnapshot) {
  if (!device.deviceId) return { online: false, label: "Not connected", canConnect: true };
  if (device.type === "button") {
    if (status.buttonsLoading) return { online: false, label: "Checking…", canConnect: !device.deviceId };
    if (status.buttonsError) return { online: false, label: "Unavailable", canConnect: !device.deviceId };
    if (status.buttonsSupported !== true) return { online: false, label: "Status unavailable", canConnect: false };
    const online = status.buttons?.some((button) => button.deviceId === device.deviceId && button.online) === true;
    return { online, label: online ? "Online" : "Offline", canConnect: false };
  }
  if (status.isLoading) return { online: false, label: "Checking…", canConnect: false };
  if (status.error) return { online: false, label: "Unavailable", canConnect: false };
  const online = status.cameras.some((camera) => camera.source !== "phone" && camera.deviceId === device.deviceId && camera.online);
  return { online, label: online ? "Online" : "Offline", canConnect: false };
}
