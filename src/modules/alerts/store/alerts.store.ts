import { create } from "zustand";

import type { AlertFields } from "../types/alert.types";

interface AlertsStore {
  alerts: AlertFields[];

  /** Add a new alert first, or update an existing one by alertId (no duplicates). */
  upsertAlert: (alert: AlertFields) => void;
  /** Merge a batch (e.g. saved alerts) by alertId, keeping existing entries. */
  mergeAlerts: (alerts: AlertFields[]) => void;
  /** Drop all alerts (e.g. on logout). */
  clearAlerts: () => void;
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  alerts: [],

  upsertAlert: (alert) =>
    set((state) => {
      const index = state.alerts.findIndex(
        (existing) => existing.alertId === alert.alertId,
      );

      if (index === -1) {
        return { alerts: [alert, ...state.alerts] };
      }

      const next = [...state.alerts];
      next[index] = { ...next[index], ...alert };
      return { alerts: next };
    }),

  mergeAlerts: (incoming) =>
    set((state) => {
      const byId = new Map(state.alerts.map((a) => [a.alertId, a]));

      for (const alert of incoming) {
        const existing = byId.get(alert.alertId);
        byId.set(alert.alertId, existing ? { ...existing, ...alert } : alert);
      }

      return { alerts: Array.from(byId.values()) };
    }),

  clearAlerts: () => set({ alerts: [] }),
}));
