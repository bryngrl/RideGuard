import { MpinError, mpinApi, type MpinStatusContext } from "./mpin.api";
import { useMpinStore } from "../store/mpin.store";
import { MPIN_BACKGROUND_LOCK_MS } from "../utils/mpin-policy";

/** Never grant access from a cached flag or an old-account response. */
export function createMpinSessionChecker() {
  let controller: AbortController | null = null;
  const cancel = () => { controller?.abort(); controller = null; };
  const check = async (user: { uid: string; getIdToken: () => Promise<string> }, context?: MpinStatusContext) => {
    cancel();
    const request = new AbortController();
    controller = request;
    const version = useMpinStore.getState().statusVersion;
    useMpinStore.getState().beginStatusCheck();
    const current = () => controller === request && !request.signal.aborted && useMpinStore.getState().owner === user.uid &&
      useMpinStore.getState().statusVersion === version;
    const timer = setTimeout(() => {
      if (current()) useMpinStore.getState().failStatusCheck();
      request.abort();
    }, 20000);
    try {
      const token = await user.getIdToken();
      if (!current()) return;
      if (context?.reason === "launch" || context?.forceUnlock ||
        (context?.inactiveForMs ?? 0) >= MPIN_BACKGROUND_LOCK_MS ||
        context?.reason === "resume" && context.inactiveForMs === undefined) {
        // Fresh launch, device lock or the inactivity deadline requires unlock. A quick
        // app switch may retain an already-authorized session, never create one.
        await mpinApi.lock(token, request.signal);
        if (!current()) return;
      }
      const result = await mpinApi.status(token, request.signal, context);
      if (current() && !useMpinStore.getState().setStatus(user.uid, result)) throw new MpinError("failed");
    } catch {
      if (current()) useMpinStore.getState().failStatusCheck();
    } finally {
      clearTimeout(timer);
      if (controller === request) controller = null;
    }
  };
  return { check, cancel };
}
