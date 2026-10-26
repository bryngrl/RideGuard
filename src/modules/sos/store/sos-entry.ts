import type { SosState } from "./sos-session";

type EntryStore = {
  getState(): SosState;
  subscribe(listener: () => void): () => void;
};

// Resolve status before leaving the screen that opened SOS. Never start an SOS here.
export async function resolveSosEntry(store: EntryStore, owner: string | null) {
  if (!owner) return "/sos" as const;
  await store.getState().setOwner(owner);
  if (store.getState().owner !== owner) return null;
  if (!store.getState().ready) throw new Error(store.getState().error ?? "Could not load SOS recovery data.");
  if (store.getState().refreshing) {
    await new Promise<void>((resolve) => {
      const unsubscribe = store.subscribe(() => {
        if (!store.getState().refreshing) { unsubscribe(); resolve(); }
      });
    });
  }
  if (store.getState().owner !== owner || !store.getState().foreground) return null;
  await store.getState().refresh();
  const state = store.getState();
  if (state.owner !== owner || !state.foreground) return null;
  if (state.phase === "idle" && state.error) throw new Error(state.error);
  if (state.phase === "countdown") return "/sos/countdown" as const;
  return state.phase === "idle" || state.phase === "preparing" ? "/sos" as const : "/sos/active" as const;
}
