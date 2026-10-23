import { createStore } from "zustand/vanilla";
import type { EmergencyContact } from "../../emergency-contacts/types/emergency-contact.types";
import { SosApiError, sosErrorMessage, type SosApi } from "../services/sos.api";
import type { Recovery, SosInput, SosLocation, SosRecord } from "../types";

export const RECOVERY_KEY = "rideguard-sos-recovery";
type Phase = "idle" | "preparing" | "countdown" | "submitting" | "checking" | "retry" | "active" | "ended";
type Dependencies = {
  api: SosApi;
  storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown>; removeItem(key: string): Promise<unknown> };
  contacts(): Promise<EmergencyContact[]>;
  shareLocation(): boolean;
  permission(): Promise<boolean>;
  capture(): Promise<SosLocation | null>;
  uuid(): string;
  now?: () => number;
};
export type SosState = {
  owner: string | null; ready: boolean; foreground: boolean; phase: Phase; remaining: number;
  contacts: EmergencyContact[]; contactsStatus: "idle" | "loading" | "ready" | "error";
  record: SosRecord | null; recovery: Recovery | null; error: string | null; refreshing: boolean; stopping: boolean;
  setOwner(uid: string | null): Promise<void>;
  setForeground(active: boolean): void;
  loadContacts(): Promise<void>;
  begin(alertId?: string): Promise<void>;
  cancelCountdown(): void;
  refresh(): Promise<void>;
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
    contactsStatus: "idle" as const, record: null, recovery: null, error: null, refreshing: false, stopping: false };

  const store = createStore<SosState>((set, get) => {
    const accept = async (record: SosRecord, ownerVersion: number) => {
      if (version !== ownerVersion) return;
      const recovery: Recovery = { uid: get().owner!, requestId: get().recovery?.requestId ?? record.requestId,
        body: null, sosId: record.sosId, stopPending: record.status !== "ended" && get().recovery?.sosId === record.sosId && (get().recovery?.stopPending ?? false) };
      set({ record, recovery, phase: record.status, error: recovery.stopPending ? "Stop has not been confirmed. Check status or retry stop." : null });
      try { await persist(recovery); }
      catch { if (version === ownerVersion) set({ error: "SOS status is confirmed, but recovery could not be saved on this phone." }); }
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
      try { await accept(await deps.api.start(owner, recovery.body, controller.signal), ownerVersion); }
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
        if (!foreground && get().phase === "countdown") get().cancelCountdown();
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
      cancelCountdown: () => {
        countdownVersion++; clearInterval(timer); timer = undefined; pendingLocation = null;
        if (["preparing", "countdown"].includes(get().phase)) set({ phase: "idle", remaining: 5 });
      },
      begin: async (alertId) => {
        if (!get().owner || !get().ready || !get().foreground || get().phase !== "idle" || get().refreshing ||
          get().contactsStatus !== "ready" || !get().contacts.length) return;
        const ownerVersion = version;
        const attemptVersion = ++countdownVersion;
        set({ phase: "preparing", error: null });
        const share = deps.shareLocation();
        let permitted = false;
        if (share) { try { permitted = await deps.permission(); } catch { /* Continue without location. */ } }
        if (version !== ownerVersion || countdownVersion !== attemptVersion) return;
        if (!get().foreground) { get().cancelCountdown(); return; }
        const deadline = now() + 5000;
        set({ phase: "countdown", remaining: 5 });
        if (permitted) void deps.capture().then((fix) => {
          if (version === ownerVersion && countdownVersion === attemptVersion && get().phase === "countdown") pendingLocation = fix;
        }).catch(() => undefined);
        timer = setInterval(() => {
          if (version !== ownerVersion || countdownVersion !== attemptVersion || get().phase !== "countdown") return;
          const remaining = Math.max(0, Math.ceil((deadline - now()) / 1000));
          set({ remaining });
          if (remaining > 0) return;
          clearInterval(timer); timer = undefined;
          const body: SosInput = { requestId: deps.uuid(), location: usableLocation(pendingLocation, now()), ...(alertId ? { alertId } : {}) };
          pendingLocation = null;
          set({ recovery: { uid: get().owner!, requestId: body.requestId, body, sosId: null, stopPending: false } });
          void submit();
        }, 200);
      },
      refresh: async () => {
        const { owner, recovery, ready, phase } = get();
        if (!owner || !ready || !get().foreground || get().refreshing || get().stopping || ["preparing", "countdown", "submitting"].includes(phase)) return;
        const ownerVersion = version;
        const queryRevision = revision;
        set({ refreshing: true });
        try {
          const [lookup, active] = await Promise.allSettled([
            recovery?.body ? deps.api.byRequest(owner, recovery.requestId, controller.signal)
              : recovery?.sosId ? deps.api.get(owner, recovery.sosId, controller.signal) : Promise.resolve(null),
            deps.api.active(owner, controller.signal),
          ]);
          if (version !== ownerVersion || revision !== queryRevision) return;
          const matched = lookup.status === "fulfilled" ? lookup.value : null;
          const currentActive = active.status === "fulfilled" ? active.value : null;
          const found = recovery?.body ? matched || currentActive : currentActive || matched;
          if (found) { await accept(found, ownerVersion); return; }
          if (lookup.status === "rejected" || active.status === "rejected") {
            set({ error: "Could not check SOS status. Check your connection and refresh.", ...(recovery ? { phase: "checking" as Phase } : {}) });
          } else if (recovery?.body) {
            set({ phase: "retry", error: "No SOS was found for this attempt. Retry sends the same saved request only when you choose." });
          } else if (recovery) {
            set({ phase: "checking", error: "The saved SOS is unavailable. Check status again before starting another." });
          } else set({ phase: "idle", error: null });
        } finally { if (version === ownerVersion) set({ refreshing: false }); }
      },
      retry: async () => { if (get().phase === "retry" && get().foreground) await submit(); },
      stop: async () => {
        const { owner, record } = get();
        if (!owner || !record || record.status === "ended" || get().stopping) return;
        const ownerVersion = version;
        revision++;
        const recovery: Recovery = { uid: owner, requestId: get().recovery?.requestId ?? record.requestId,
          body: null, sosId: record.sosId, stopPending: true };
        set({ stopping: true, recovery, error: null });
        try {
          await persist(recovery);
          if (version !== ownerVersion) return;
          await accept(await deps.api.stop(owner, record.sosId, controller.signal), ownerVersion);
        } catch {
          if (version === ownerVersion) set({ error: "Stop could not be confirmed. Check status or retry stop." });
        } finally {
          if (version === ownerVersion) { set({ stopping: false }); await get().refresh(); }
        }
      },
      dismissEnded: async () => {
        if (get().record?.status !== "ended") return;
        revision++;
        set({ record: null, recovery: null, phase: "idle", error: null });
        await persist(null).catch(() => undefined);
      },
    };
  });
  return store;
}
