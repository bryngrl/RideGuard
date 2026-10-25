import { createStore } from "zustand/vanilla";
import type { EmergencyContact } from "../../emergency-contacts/types/emergency-contact.types";
import { SosApiError, sosErrorMessage, type SosApi } from "../services/sos.api";
import type { Recovery, SosInput, SosLocation, SosRecord } from "../types";
import { trackingDeadline } from "../types";

export const RECOVERY_KEY = "rideguard-sos-recovery";
export type LocationDiagnostic = {
  event: "capture_started" | "capture_finished" | "capture_failed" | "capture_late" | "submission_location" | "confirmed_location";
  elapsedMs?: number;
  reason?: "included" | "capture_pending" | "capture_failed" | "no_fix" | "invalid_or_stale_fix";
  errorCode?: string;
  requestId?: string;
  hasLocation?: boolean;
};
type Phase = "idle" | "preparing" | "countdown" | "submitting" | "checking" | "retry" | "active" | "ended";
type Dependencies = {
  api: SosApi;
  storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown>; removeItem(key: string): Promise<unknown> };
  contacts(): Promise<EmergencyContact[]>;
  shareLocation(): boolean;
  permission(): Promise<boolean>;
  capture(): Promise<SosLocation | null>;
  uuid(): string;
  locationDiagnostic?(event: LocationDiagnostic): void;
  now?: () => number;
};
export type SosState = {
  owner: string | null; ready: boolean; foreground: boolean; phase: Phase; remaining: number;
  contacts: EmergencyContact[]; contactsStatus: "idle" | "loading" | "ready" | "error";
  record: SosRecord | null; recovery: Recovery | null; error: string | null; notice: string | null; refreshing: boolean; stopping: boolean;
  lastFetchedAt: string | null; nextPollAt: number; lookupFailures: number;
  setOwner(uid: string | null): Promise<void>;
  setForeground(active: boolean): void;
  loadContacts(): Promise<void>;
  begin(alertId?: string): Promise<void>;
  cancelCountdown(notice?: string): void;
  refresh(discover?: boolean): Promise<void>;
  refreshStatus(): Promise<void>;
  retry(): Promise<void>;
  stop(): Promise<void>;
  dismissEnded(): Promise<void>;
};

export function usableLocation(value: SosLocation | null, now: number): SosLocation | null {
  if (!value || !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) ||
    Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180 ||
    (value.accuracyMeters !== null && (!Number.isFinite(value.accuracyMeters) || value.accuracyMeters < 0))) return null;
  const age = now - Date.parse(value.capturedAt);
  return Number.isFinite(age) && age >= -60000 && age <= 120000 ? { ...value } : null;
}

function readRecovery(raw: string | null, uid: string): Recovery | null {
  try {
    const value = JSON.parse(raw ?? "null") as Recovery | null;
    if (!value || value.uid !== uid || typeof value.requestId !== "string" ||
      !(value.sosId === null || typeof value.sosId === "string") ||
      !(value.body === null || (value.body && value.body.requestId === value.requestId))) return null;
    return { ...value, stopPending: value.stopPending === true };
  } catch { return null; }
}

export function createSosStore(deps: Dependencies) {
  const now = deps.now ?? Date.now;
  let version = 0;
  let revision = 0;
  let refreshVersion = 0;
  let countdownVersion = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let pendingLocation: SosLocation | null = null;
  let controller = new AbortController();
  // Serialize writes/removals so logout cannot be overtaken by an older write.
  let storageTail: Promise<unknown> = Promise.resolve();
  const persist = (value: Recovery | null) => {
    const write = storageTail.catch(() => undefined).then(() => value
      ? deps.storage.setItem(RECOVERY_KEY, JSON.stringify(value)) : deps.storage.removeItem(RECOVERY_KEY));
    storageTail = write;
    return write;
  };
  const initial = { ready: false, phase: "idle" as Phase, remaining: 5, contacts: [] as EmergencyContact[],
    contactsStatus: "idle" as const, record: null, recovery: null, error: null, notice: null, refreshing: false, stopping: false,
    lastFetchedAt: null, nextPollAt: 0, lookupFailures: 0 };

  const store = createStore<SosState>((set, get) => {
    const accept = async (record: SosRecord, ownerVersion: number) => {
      if (version !== ownerVersion) return;
      const acceptedRevision = revision;
      const recovery: Recovery = { uid: get().owner!, requestId: get().recovery?.requestId ?? record.requestId,
        body: null, sosId: record.sosId, stopPending: record.status !== "ended" && get().recovery?.sosId === record.sosId && (get().recovery?.stopPending ?? false) };
      set({ record, recovery, phase: record.status, error: recovery.stopPending ? "Stop has not been confirmed. Check status or retry stop." : null });
      try { await persist(recovery); }
      catch { if (version === ownerVersion && revision === acceptedRevision) set({ error: "SOS status is confirmed, but recovery could not be saved on this phone." }); }
    };
    const submit = async () => {
      const { owner, recovery } = get();
      if (!owner || !recovery?.body || get().phase === "submitting") return;
      const ownerVersion = version;
      revision++;
      set({ phase: "submitting", error: null });
      try { await persist(recovery); }
      catch { if (version === ownerVersion) set({ phase: "retry", error: "Could not save SOS recovery data. No request was sent. Try again." }); return; }
      if (version !== ownerVersion) return;
      if (!get().foreground) { set({ phase: "retry", error: "SOS was not submitted before the app left the foreground. Retry when ready." }); return; }
      try {
        const record = await deps.api.start(owner, recovery.body, controller.signal);
        deps.locationDiagnostic?.({ event: "confirmed_location", requestId: recovery.requestId, hasLocation: !!record.location });
        await accept(record, ownerVersion);
      }
      catch (error) {
        if (version !== ownerVersion) return;
        const definite = error instanceof SosApiError && (error.code === "SOS_DISABLED" || [400, 401, 403, 404, 409, 422].includes(error.status));
        if (definite) set({ phase: "retry", error: sosErrorMessage(error) });
        else { set({ phase: "checking", error: "Checking SOS status. Submission could not be confirmed." }); await get().refresh(); }
      }
    };
    return {
      ...initial, owner: null, foreground: false,
      setOwner: async (owner) => {
        if (owner === get().owner && (get().ready || !owner)) return;
        const previous = get().owner;
        const ownerVersion = ++version;
        revision++;
        get().cancelCountdown(); controller.abort(); controller = new AbortController();
        set({ ...initial, owner });
        try {
          if (previous && previous !== owner) await persist(null);
          if (!owner) return;
          await storageTail.catch(() => undefined);
          const raw = await deps.storage.getItem(RECOVERY_KEY);
          if (version !== ownerVersion) return;
          const recovery = readRecovery(raw, owner);
          if (raw && !recovery) await persist(null);
          if (version !== ownerVersion) return;
          set({ recovery, ready: true, phase: recovery ? "checking" : "idle" });
        } catch { if (version === ownerVersion) set({ error: "Could not load SOS recovery data. Reopen SOS to try again." }); }
      },
      setForeground: (foreground) => {
        set({ foreground });
        if (!foreground && get().phase === "countdown") get().cancelCountdown("SOS countdown cancelled because the app was interrupted. No request was sent. Tap again when ready.");
      },
      loadContacts: async () => {
        if (!get().owner || get().contactsStatus === "loading") return;
        const ownerVersion = version;
        set({ contactsStatus: "loading" });
        try {
          const contacts = await deps.contacts();
          if (version === ownerVersion) set({ contacts, contactsStatus: "ready" });
        } catch { if (version === ownerVersion) set({ contactsStatus: "error" }); }
      },
      cancelCountdown: (notice) => {
        countdownVersion++; clearInterval(timer); timer = undefined; pendingLocation = null;
        if (["preparing", "countdown"].includes(get().phase)) set({ phase: "idle", remaining: 5, notice: notice ?? null });
      },
      begin: async (alertId) => {
        if (!get().owner || !get().ready || !get().foreground || get().phase !== "idle" || get().refreshing ||
          get().contactsStatus !== "ready" || !get().contacts.length) return;
        const ownerVersion = version;
        const attemptVersion = ++countdownVersion;
        set({ phase: "preparing", error: null, notice: null });
        if (!deps.shareLocation()) {
          get().cancelCountdown("Allow location sharing with emergency contacts to use SOS.");
          return;
        }
        let permitted = false;
        try { permitted = await deps.permission(); } catch { /* Permission could not be confirmed. */ }
        if (version !== ownerVersion || countdownVersion !== attemptVersion) return;
        if (!permitted || !deps.shareLocation()) {
          get().cancelCountdown("Location permission and sharing with emergency contacts are required to use SOS. Tap again to allow location access.");
          return;
        }
        if (!get().foreground) { get().cancelCountdown("SOS preparation cancelled because the app was interrupted. No request was sent. Tap again when ready."); return; }
        const deadline = now() + 5000;
        const captureStartedAt = now();
        let captureState: "pending" | "failed" | "finished" = "pending";
        set({ phase: "countdown", remaining: 5 });
        deps.locationDiagnostic?.({ event: "capture_started" });
        if (permitted) void deps.capture().then((fix) => {
          const current = version === ownerVersion && countdownVersion === attemptVersion && get().phase === "countdown";
          captureState = "finished";
          deps.locationDiagnostic?.({ event: current ? "capture_finished" : "capture_late", elapsedMs: now() - captureStartedAt, hasLocation: !!fix });
          if (current) pendingLocation = fix;
        }).catch((error: unknown) => {
          captureState = "failed";
          const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
          deps.locationDiagnostic?.({ event: "capture_failed", elapsedMs: now() - captureStartedAt, errorCode: code });
        });
        timer = setInterval(() => {
          if (version !== ownerVersion || countdownVersion !== attemptVersion || get().phase !== "countdown") return;
          const remaining = Math.max(0, Math.ceil((deadline - now()) / 1000));
          set({ remaining });
          if (remaining > 0) return;
          if (!deps.shareLocation()) {
            get().cancelCountdown("SOS cancelled because location sharing was turned off. No request was sent.");
            return;
          }
          clearInterval(timer); timer = undefined;
          const body: SosInput = { requestId: deps.uuid(), location: usableLocation(pendingLocation, now()), ...(alertId ? { alertId } : {}) };
          deps.locationDiagnostic?.({ event: "submission_location", requestId: body.requestId, elapsedMs: now() - captureStartedAt,
            hasLocation: !!body.location, reason: body.location ? "included" : captureState === "pending" ? "capture_pending" :
              captureState === "failed" ? "capture_failed" : pendingLocation ? "invalid_or_stale_fix" : "no_fix" });
          pendingLocation = null;
          set({ recovery: { uid: get().owner!, requestId: body.requestId, body, sosId: null, stopPending: false } });
          void submit();
        }, 200);
      },
      refresh: async (discover = true) => {
        const { owner, recovery, ready, phase } = get();
        if (!owner || !ready || !get().foreground || get().refreshing || get().stopping || ["preparing", "countdown", "submitting"].includes(phase)) return;
        const ownerVersion = version;
        const queryRevision = revision;
        const refreshAttempt = ++refreshVersion;
        set({ refreshing: true });
        try {
          const [lookup, active] = await Promise.allSettled([
            recovery?.body ? deps.api.byRequest(owner, recovery.requestId, controller.signal)
              : recovery?.sosId ? deps.api.get(owner, recovery.sosId, controller.signal) : Promise.resolve(null),
            !recovery?.sosId || discover ? deps.api.active(owner, controller.signal) : Promise.resolve(null),
          ]);
          if (version !== ownerVersion || revision !== queryRevision) return;
          const matched = lookup.status === "fulfilled" ? lookup.value : null;
          const currentActive = active.status === "fulfilled" ? active.value : null;
          const found = recovery?.body ? matched || currentActive : currentActive || matched;
          if (found) { set({ lastFetchedAt: new Date(now()).toISOString(), lookupFailures: 0, nextPollAt: now() + 5000 }); await accept(found, ownerVersion); return; }
          if (lookup.status === "rejected" || active.status === "rejected") {
            const failures = get().lookupFailures + 1;
            const deadline = trackingDeadline(get().record);
            const retryAt = now() + Math.min(60000, 10000 * 2 ** (failures - 1));
            set({ error: "Could not check SOS status. Showing last-known results. Retry status when connected.", lookupFailures: failures,
              nextPollAt: deadline && deadline > now() ? Math.min(deadline, retryAt) : retryAt, ...(recovery && !get().record ? { phase: "checking" as Phase } : {}) });
          } else if (recovery?.body) {
            set({ phase: "retry", error: "No SOS was found for this attempt. Retry sends the same saved request only when you choose." });
          } else if (recovery) {
            set({ phase: "checking", error: "The saved SOS is unavailable. Check status again before starting another." });
          } else set({ phase: "idle", error: null });
        } finally { if (version === ownerVersion && refreshVersion === refreshAttempt) set({ refreshing: false }); }
      },
      refreshStatus: async () => {
        const { owner, record } = get();
        if (!record) { await get().refresh(); return; }
        if (!owner || !get().foreground || get().refreshing || get().stopping) return;
        const ownerVersion = version; const queryRevision = revision;
        const refreshAttempt = ++refreshVersion;
        set({ refreshing: true });
        try {
          let updated: SosRecord;
          let legacy = false;
          try { updated = await deps.api.refreshStatus(owner, record.sosId, controller.signal); }
          catch (error) {
            if (!(error instanceof SosApiError) || error.status !== 404) throw error;
            // A missing route and an absent/foreign SOS both use 404. Verify ownership once.
            updated = await deps.api.get(owner, record.sosId, controller.signal); legacy = true;
          }
          if (version !== ownerVersion || revision !== queryRevision) return;
          await accept(updated, ownerVersion);
          if (version !== ownerVersion || revision !== queryRevision) return;
          set({ notice: legacy ? "Enhanced status refresh is unavailable on this service." : null,
            lastFetchedAt: legacy ? new Date(now()).toISOString() : get().lastFetchedAt, nextPollAt: now() + 5000 });
        } catch (error) {
          if (version === ownerVersion && revision === queryRevision) set({ notice: null, error: error instanceof SosApiError && error.status === 404
            ? "The saved SOS is unavailable." : "Could not refresh message status. Showing last-known results. Retry status when connected." });
        } finally { if (version === ownerVersion && refreshVersion === refreshAttempt) set({ refreshing: false }); }
      },
      retry: async () => { if (get().phase === "retry" && get().foreground) await submit(); },
      stop: async () => {
        const { owner, record } = get();
        if (!owner || !record || record.status === "ended" || get().stopping) return;
        const ownerVersion = version;
        revision++;
        const stopRevision = revision;
        const recovery: Recovery = { uid: owner, requestId: get().recovery?.requestId ?? record.requestId,
          body: null, sosId: record.sosId, stopPending: true };
        set({ stopping: true, recovery, error: null });
        try {
          await persist(recovery);
          if (version !== ownerVersion || revision !== stopRevision) return;
          const ended = await deps.api.stop(owner, record.sosId, controller.signal);
          if (version !== ownerVersion || revision !== stopRevision) return;
          await accept(ended, ownerVersion);
        } catch {
          if (version === ownerVersion && revision === stopRevision) set({ error: "Stop could not be confirmed. Check status or retry stop." });
        } finally {
          if (version === ownerVersion && revision === stopRevision) { set({ stopping: false }); await get().refresh(); }
        }
      },
      dismissEnded: async () => {
        if (get().record?.status !== "ended") return;
        revision++;
        refreshVersion++;
        controller.abort(); controller = new AbortController();
        set({ record: null, recovery: null, phase: "idle", error: null, notice: null,
          refreshing: false, stopping: false, lastFetchedAt: null, nextPollAt: 0, lookupFailures: 0 });
        await persist(null).catch(() => undefined);
      },
    };
  });
  return store;
}
