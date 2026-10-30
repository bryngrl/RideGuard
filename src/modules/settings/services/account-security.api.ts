import { apiClient } from "@/shared/api";
import { APIError } from "@/shared/api/errors";
import { getPasswordError } from "@/modules/auth/utils/password-validation";

export async function changeAccountPassword(token: string, currentPassword: string, newPassword: string, signal?: AbortSignal): Promise<void> {
  if (!currentPassword || getPasswordError(newPassword) || currentPassword === newPassword) throw new Error("Check your current and new passwords.");
  const result = await apiClient.request<{ success: boolean; data: { success: boolean } }>("/auth/change-password", {
    method: "POST", token, signal, body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (result?.success !== true || result.data?.success !== true) throw new Error("Password change was not confirmed.");
}

export function accountSecurityError(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 401) return /invalid password/i.test(error.message) ? "Your current password is incorrect." : "Your session expired. Log in again.";
    if (error.status === 400) return "Choose a different password with at least eight characters, a letter and a number.";
    if (error.status === 403) return "This account cannot make changes right now. Contact support.";
    if (error.status === 404) return "This feature is not available on the server yet.";
    if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
    if (error.status === 408) return "We couldn't confirm the change before the request timed out. Try logging in before retrying.";
    if (error.status >= 500) return "The service is unavailable. Try again shortly.";
  }
  return "Couldn't confirm the change. Check your connection and try again.";
}
