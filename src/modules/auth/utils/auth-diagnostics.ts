import { APIError } from "@/shared/api/errors";

type LoginStage = "backend-login" | "firebase-sign-in" | "account-refresh" | "profile-check" | "session-routing";

/** Log timing and public operation names only, never credentials or responses. */
export async function traceLoginStage<T>(stage: LoginStage, work: () => Promise<T>): Promise<T> {
  const started = Date.now();
  console.info("[RideGuard login]", { stage, outcome: "started" });
  try {
    const result = await work();
    console.info("[RideGuard login]", { stage, outcome: "completed", elapsedMs: Date.now() - started });
    return result;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      && /^auth\/[a-z-]+$/.test(error.code) ? error.code : undefined;
    console.info("[RideGuard login]", { stage, outcome: "failed", elapsedMs: Date.now() - started,
      ...(error instanceof APIError ? { status: error.status, endpoint: error.endpoint?.split("?")[0] } : {}),
      ...(code ? { code } : {}),
    });
    throw error;
  }
}
