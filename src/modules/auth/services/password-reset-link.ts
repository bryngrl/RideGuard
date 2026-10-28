import { verifyPasswordResetLink } from "./password-recovery";
import { usePasswordRecoveryStore } from "../store/password-recovery.store";

/** Strip the action code from navigation after Firebase validates it. */
export async function routePasswordResetLink(path: string): Promise<string> {
  let url: URL;
  try { url = new URL(path, "rideguard://"); } catch { return "/forgot-password?linkError=invalid"; }
  if (url.searchParams.get("mode") !== "resetPassword") return path;
  usePasswordRecoveryStore.getState().clearVerifiedSession();
  const codes = url.searchParams.getAll("oobCode");
  if (codes.length !== 1 || !codes[0] || codes[0].length > 4096) return "/forgot-password?linkError=invalid";
  const requestedEmail = usePasswordRecoveryStore.getState().requestedEmail;
  try {
    const result = await verifyPasswordResetLink(codes[0], requestedEmail);
    // An edited/new request cannot be replaced by a late old-email link check.
    if (usePasswordRecoveryStore.getState().requestedEmail !== requestedEmail) return "/forgot-password";
    if (!usePasswordRecoveryStore.getState().setVerifiedSession(result.email, result.session)) {
      return "/forgot-password?linkError=invalid";
    }
    return "/new-password";
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    return `/forgot-password?linkError=${code === "network" ? "network" : "invalid"}`;
  }
}
