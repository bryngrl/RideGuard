import type { MpinMode } from "../services/mpin.api";

/** Keep unfinished onboarding in its own authenticated navigator. */
export function mpinStepRoute(step: string, mode: MpinMode, onboarding: boolean) {
  return onboarding
    ? { pathname: "/(onboarding)/register/mpin" as const, params: { step, mode } }
    : { pathname: "/(mpin)/mpin/[step]" as const, params: { step, mode } };
}
