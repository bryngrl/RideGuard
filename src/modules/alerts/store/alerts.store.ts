import { create } from "zustand";

import type { AlertFields } from "../types/alert.types";

/**
 * Merge an incoming payload onto an existing alert without ever moving an
 * already-archived alert back to active. A delayed realtime `alert.created`
 * (or an older page) can arrive with isArchived=false after the backend has
 * archived the record; archive status is sticky, so we keep it.
 */
function mergeAlertFields(
  existing: AlertFields,
  incoming: AlertFields,
): AlertFields {
  const merged = { ...existing, ...incoming };

  if (existing.isArchived && !incoming.isArchived) {
    merged.isArchived = true;
    merged.archivedAt = existing.archivedAt;
    merged.archiveAt = null;
  }

  // Polling often returns identical records. Retain their references so every
  // unchanged response does not redraw alert lists, Home and realtime discovery.
  const unchanged = Object.keys(merged).every((field) => {
    const key = field as keyof AlertFields;
    const before = existing[key], after = merged[key];
    return Object.is(before, after) || Array.isArray(before) && Array.isArray(after) &&
      before.length === after.length && before.every((value, index) => value === after[index]);
  });
  return unchanged ? existing : merged;
}

interface AlertsStore {
  alerts: AlertFields[];
  /**
   * Bumped to ask the alerts list to refetch from the backend (e.g. after the
   * auto-archive preference changes on another screen). The list hook watches
   * this and reruns the current tab's status query with its pagination reset.
   */
  listRefreshNonce: number;

  /** Add a new alert first, or update an existing one by alertId (no duplicates). */
  upsertAlert: (alert: AlertFields) => void;
  /** Merge a batch (e.g. saved alerts) by alertId, keeping existing entries. */
  mergeAlerts: (alerts: AlertFields[]) => void;
  /** Drop all alerts (e.g. on logout). */
  clearAlerts: () => void;
  /** Signal the list to refetch (see {@link listRefreshNonce}). */
  bumpListRefresh: () => void;
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  alerts: [],
  listRefreshNonce: 0,

  upsertAlert: (alert) =>
    set((state) => {
      const index = state.alerts.findIndex(
        (existing) => existing.alertId === alert.alertId,
      );

      if (index === -1) {
        return { alerts: [alert, ...state.alerts] };
      }

      const merged = mergeAlertFields(state.alerts[index], alert);
      if (merged === state.alerts[index]) return state;
      const next = [...state.alerts];
      next[index] = merged;
      return { alerts: next };
    }),

  mergeAlerts: (incoming) =>
    set((state) => {
      const byId = new Map(state.alerts.map((a) => [a.alertId, a]));
      let changed = false;

      for (const alert of incoming) {
        const existing = byId.get(alert.alertId);
        const merged = existing ? mergeAlertFields(existing, alert) : alert;
        if (merged !== existing) changed = true;
        byId.set(alert.alertId, merged);
      }

      return changed ? { alerts: Array.from(byId.values()) } : state;
    }),

  clearAlerts: () => set({ alerts: [] }),

  bumpListRefresh: () =>
    set((state) => ({ listRefreshNonce: state.listRefreshNonce + 1 })),
}));
