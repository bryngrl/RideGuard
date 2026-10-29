import type { ButtonHardwareEvent } from "../types/button-test";

export const BUTTON_EVENTS_CHANNEL = "rideguard:buttons:device";

/** Interpret only events from the button claimed by this account. */
export function parseButtonEvent(message: { name?: string; data?: unknown }, deviceId: string): {
  event: ButtonHardwareEvent; id?: string;
} | null {
  let data = message.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { return null; }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as Record<string, unknown>;
  if (!deviceId || payload.device_id !== deviceId) return null;
  const id = typeof payload.event_id === "string" ? payload.event_id : undefined;
  if (message.name === "button.press_started" && payload.button === "SOS" && typeof payload.press_id === "string") {
    return { id, event: { type: "hold-start", button: "red" } };
  }
  if (message.name === "button.press_released" && payload.button === "SOS" && typeof payload.press_id === "string" &&
    typeof payload.held_ms === "number" && Number.isFinite(payload.held_ms) && payload.held_ms >= 0) {
    return { id, event: { type: "hold-end", button: "red" } };
  }
  if (message.name !== "button.pressed") return null;
  switch (payload.press_type) {
    case "START_CAPTURE": case "STOP_CAPTURE": return { id, event: { type: "pulse", button: "white" } };
    case "FALSE_ALARM": case "CANCEL_SOS": return { id, event: { type: "pulse", button: "red" } };
    case "SOS": return { id, event: { type: "long-press", button: "red" } };
    default: return null;
  }
}
