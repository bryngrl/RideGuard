import type { LiveCamera } from "@/modules/camera-sensor/types/live-camera.types";

export function devicePresence(device: { type: "camera" | "button"; deviceId: string },
  status: { cameras: LiveCamera[]; isLoading: boolean; error: string | null }) {
  if (!device.deviceId) return { online: false, label: "Offline", canConnect: true };
  // Pairing and button-press events cannot establish ongoing hardware presence.
  if (device.type === "button") return { online: false, label: "Status unavailable", canConnect: false };
  if (status.isLoading) return { online: false, label: "Checking…", canConnect: false };
  if (status.error) return { online: false, label: "Unavailable", canConnect: false };
  const online = status.cameras.some((camera) => camera.source !== "phone" && camera.deviceId === device.deviceId && camera.online);
  return { online, label: online ? "Online" : "Offline", canConnect: !online };
}
