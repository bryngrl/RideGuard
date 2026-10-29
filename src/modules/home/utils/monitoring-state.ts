import type { AlertFields } from "@/modules/alerts/types/alert.types";
import { alertTimeValue, getAlertDetectionType } from "@/modules/alerts/services/alerts.mapper";

export type MonitoringCardState = "no-camera" | "checking" | "unavailable" | "offline" | "monitoring" | "threat";
export interface MonitoringStatusOptions {
  hasCameraConnected: boolean;
  hasOnlineCamera?: boolean;
  checking?: boolean;
  unavailable?: boolean;
}

/** Archive membership comes from the server; never infer it from a local deadline. */
export function monitoringState(alerts: AlertFields[], options: MonitoringStatusOptions) {
  if (!options.hasCameraConnected) return { state: "no-camera" as const, title: "No external camera", subtitle: "Connect one to start monitoring" };
  const latest = alerts.filter((alert) => !alert.isArchived).sort((a, b) =>
    alertTimeValue(b.timeStamp) - alertTimeValue(a.timeStamp))[0];
  const detection = latest && !latest.isFalseAlarm ? getAlertDetectionType(latest.message) : "none";
  if (detection !== "none") return {
    state: "threat" as const,
    title: detection === "both" ? "Violence and Weapon detected" : detection === "violence" ? "Violence detected" : "Weapon detected",
    subtitle: detection === "violence" ? "Unusual movement was detected.\nUse manual SOS if you need help."
      : detection === "weapon" ? "A possible weapon was detected.\nUse manual SOS if you need help."
        : "Unusual movement and a possible weapon were detected.\nUse manual SOS if you need help.",
  };
  if (options.checking) return { state: "checking" as const, title: "Checking cameras", subtitle: "Checking your camera connection." };
  if (options.unavailable) return { state: "unavailable" as const, title: "Camera status unavailable", subtitle: "Check your connection and try again." };
  if (options.hasOnlineCamera === false) return { state: "offline" as const, title: "Camera offline", subtitle: "Bring your camera online to resume monitoring." };
  return { state: "monitoring" as const, title: "Monitoring active", subtitle: "Nothing detected right now." };
}
