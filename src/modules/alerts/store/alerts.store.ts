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

  return merged;
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

      const next = [...state.alerts];
      next[index] = mergeAlertFields(next[index], alert);
      return { alerts: next };
    }),

  mergeAlerts: (incoming) =>
    set((state) => {
      const byId = new Map(state.alerts.map((a) => [a.alertId, a]));

      for (const alert of incoming) {
        const existing = byId.get(alert.alertId);
        byId.set(
          alert.alertId,
          existing ? mergeAlertFields(existing, alert) : alert,
        );
      }

      return { alerts: Array.from(byId.values()) };
    }),

  clearAlerts: () => set({ alerts: [] }),

  bumpListRefresh: () =>
    set((state) => ({ listRefreshNonce: state.listRefreshNonce + 1 })),
}));
