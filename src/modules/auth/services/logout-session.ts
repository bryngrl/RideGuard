import { apiClient } from "@/shared/api";
import { getInstallationId } from "@/modules/notifications/services/installation-id";

/** Revoke only this installation; Firebase logout must still work when offline. */
export async function revokeLogoutSession(token: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const result = await apiClient.request<{ success: boolean; data: { success: boolean } }>("/auth/logout", {
      method: "POST", token, signal: controller.signal,
      headers: { "x-device-id": await getInstallationId() },
    });
    if (result?.success !== true || result.data?.success !== true) throw new Error("Logout not confirmed.");
  } finally { clearTimeout(timer); }
}
