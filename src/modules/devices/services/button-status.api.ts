import { apiClient } from "@/shared/api";

export interface LiveButton {
  deviceId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export async function getMyButtons(token: string): Promise<LiveButton[]> {
  const response = await apiClient.get<{ success: boolean; data: unknown }>("/devices/buttons", token);
  if (response?.success !== true || !Array.isArray(response.data)) throw new Error("Couldn't load button status.");
  return response.data.map((item: unknown) => {
    if (!item || typeof item !== "object" || !("device_id" in item) ||
      typeof item.device_id !== "string" || !/^BUT-\d{3}-[A-Z]{3}$/.test(item.device_id) ||
      !("online" in item) || typeof item.online !== "boolean" || !("last_seen_at" in item) ||
      (item.last_seen_at !== null && (typeof item.last_seen_at !== "string" || !Number.isFinite(Date.parse(item.last_seen_at))))) {
      throw new Error("Couldn't load button status.");
    }
    return { deviceId: item.device_id, online: item.online, lastSeenAt: item.last_seen_at };
  });
}
