import { routePasswordResetLink } from "@/modules/auth/services/password-reset-link";

export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return await routePasswordResetLink(path);
  } catch {
    // Never return reset credentials in an unmatched route or error screen.
    return "/forgot-password?linkError=invalid";
  }
}
