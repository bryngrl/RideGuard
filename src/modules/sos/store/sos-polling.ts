import { hasPending, trackingDeadline } from "../types";
import type { SosState } from "./sos-session";

// Called only by a focused screen. Foreground changes cancel and recreate its timer.
export function startStatusPolling(store: { getState(): SosState; subscribe?(listener: () => void): () => void }, now = Date.now) {
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finalDeadline: number | null = null;
  let lastSos: string | undefined;
  let busy = false;
  const schedule = () => {
    const state = store.getState();
    const deadline = trackingDeadline(state.record);
    const final = deadline !== null && deadline <= now() && finalDeadline !== deadline;
    if (disposed || !state.owner || !state.ready || !state.foreground) { clearTimeout(timer); timer = undefined; return; }
    if (!busy && timer === undefined && (hasPending(state.record, now()) || state.phase === "checking" || final))
      timer = setTimeout(() => void poll(), 1000);
  };
  const poll = async (entry = false) => {
    if (disposed) return;
    timer = undefined;
    const state = store.getState();
    if (!state.owner || !state.ready || !state.foreground) return;
    if (state.record?.sosId !== lastSos) { lastSos = state.record?.sosId; finalDeadline = null; }
    const deadline = trackingDeadline(state.record);
    const final = deadline !== null && deadline <= now() && finalDeadline !== deadline;
    busy = true;
    if (entry || ((hasPending(state.record, now()) || state.phase === "checking" || final) && now() >= state.nextPollAt)) {
      await state.refresh(entry);
      if (final && !store.getState().error) finalDeadline = deadline;
    }
    busy = false;
    schedule();
  };
  const unsubscribe = store.subscribe?.(schedule);
  void poll(true);
  return () => { disposed = true; clearTimeout(timer); unsubscribe?.(); };
}
