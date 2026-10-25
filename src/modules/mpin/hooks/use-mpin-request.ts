import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { MpinError, mpinErrorMessage } from "../services/mpin.api";
import { useMpinStore } from "../store/mpin.store";

export function useMpinRequest(onFailure?: (error: unknown) => void) {
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const failure = useRef(onFailure);
  failure.current = onFailure;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    active.current = true;
    setLoading(false);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") { controller.current?.abort(); setLoading(false); }
    });
    return () => { active.current = false; controller.current?.abort(); subscription.remove(); };
  }, []));

  const run = async <T,>(work: (token: string, signal: AbortSignal) => Promise<T>, success: (value: T) => void) => {
    if (controller.current || !active.current) return;
    const user = useAuthStore.getState().user;
    if (!user) { setError("Log in to use MPIN."); return; }
    const owner = user.uid;
    const generation = useMpinStore.getState().generation;
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(null);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, 20000);
    const stillCurrent = () => active.current && useAuthStore.getState().user?.uid === owner &&
      useMpinStore.getState().owner === owner && useMpinStore.getState().generation === generation;
    try {
      const stopped = new Promise<never>((_, reject) => {
        abort.signal.addEventListener("abort", () => reject(new MpinError(timedOut ? "timeout" : "failed")), { once: true });
      });
      const operation = (async () => {
        const token = await user.getIdToken();
        if (abort.signal.aborted || !stillCurrent()) throw new MpinError("failed");
        return work(token, abort.signal);
      })();
      const result = await Promise.race([operation, stopped]);
      if (!abort.signal.aborted && stillCurrent()) success(result);
    } catch (reason) {
      if (stillCurrent() && (!abort.signal.aborted || timedOut)) {
        setError(mpinErrorMessage(reason));
        failure.current?.(reason);
      }
    } finally {
      clearTimeout(timer);
      if (controller.current === abort) controller.current = null;
      if (active.current) setLoading(false);
    }
  };
  return {
    run, loading, error, setError,
    isPending: () => !!controller.current,
    cancel: () => { controller.current?.abort(); setLoading(false); },
  };
}
