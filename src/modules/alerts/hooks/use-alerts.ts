import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { ALERTS_PAGE_SIZE } from "../constants";
import { getSavedAlerts } from "../services/alerts.api";
import { alertTimeValue } from "../services/alerts.mapper";
import { useAlertsStore } from "../store/alerts.store";
import type { AlertFields } from "../types/alert.types";

// The backend status a tab reads. "unread" is a client-side filter over the
// active list (active + unseen), not a separate backend status.
export type AlertListStatus = "active" | "archived";

// Refetch the visible list this often while the screen is focused, so a change
// made on another device (or the background archive pass) shows up without the
// user doing anything. Matches the ~60s backend pass cadence.
const VISIBLE_REFRESH_MS = 60_000;

/** True when an entity still belongs in the given server list. */
function matchesStatus(alert: AlertFields, status: AlertListStatus): boolean {
  if (alert.isFalseAlarm) return false;
  return status === "archived" ? alert.isArchived : !alert.isArchived;
}

/**
 * Owns one tab's list: it fetches that status from the backend, keeps its own
 * pagination cursor and ordered membership (separate from the other tab), and
 * refreshes on focus, on foreground, every 60s while visible, and whenever the
 * auto-archive preference changes. Membership comes from the server so an alert
 * that moved to the other list drops out on the next refresh; a brand-new
 * realtime alert is still shown immediately on the active list.
 *
 * The store holds alert *entities* (so seen/false-alarm/archive updates reflect
 * live); this hook holds the ordered IDs for its status.
 */
export function useAlertsList(status: AlertListStatus) {
  const user = useAuthStore((state) => state.user);
  const alerts = useAlertsStore((state) => state.alerts);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);
  const listRefreshNonce = useAlertsStore((state) => state.listRefreshNonce);

  // Server-authoritative membership for this status, in page order.
  const [ids, setIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (mode: "reset" | "more") => {
      if (!user || isFetchingRef.current) return;
      if (mode === "more" && (!hasMoreRef.current || !cursorRef.current)) return;

      isFetchingRef.current = true;
      if (mode === "reset") setIsRefreshing(true);
      else setIsLoadingMore(true);

      try {
        const token = await user.getIdToken();
        const page = await getSavedAlerts(token, {
          status,
          limit: ALERTS_PAGE_SIZE,
          cursor: mode === "more" ? (cursorRef.current ?? undefined) : undefined,
        });

        // Entities first, so rendering by ID always finds its data.
        mergeAlerts(page.alerts);
        const pageIds = page.alerts
          .map((alert) => alert.alertId)
          .filter((id): id is string => typeof id === "string");

        setIds((previous) =>
          mode === "reset"
            ? pageIds
            : [...previous, ...pageIds.filter((id) => !previous.includes(id))],
        );

        cursorRef.current = page.nextCursor;
        hasMoreRef.current = page.nextCursor !== null;
      } catch (error) {
        console.error(`[Alerts] Failed to load ${status} alerts:`, error);
      } finally {
        isFetchingRef.current = false;
        if (mode === "reset") setIsRefreshing(false);
        else setIsLoadingMore(false);
      }
    },
    [user, status, mergeAlerts],
  );

  const refresh = useCallback(() => {
    cursorRef.current = null;
    hasMoreRef.current = true;
    void fetchPage("reset");
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    void fetchPage("more");
  }, [fetchPage]);

  // Refresh when the preference changes (the save screen bumps the nonce).
  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status, listRefreshNonce]);

  // Focus + foreground + periodic refresh, all bounded to "while this screen is
  // visible": the interval and AppState listener are set up on focus and torn
  // down on blur.
  useFocusEffect(
    useCallback(() => {
      refresh();

      const interval = setInterval(refresh, VISIBLE_REFRESH_MS);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") refresh();
      });

      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [refresh]),
  );

  // Resolve membership IDs to entities, keep only those still matching this
  // status, and (for the active list) fold in realtime alerts not yet paged in.
  const visibleAlerts = useMemo(() => {
    const byId = new Map(
      alerts
        .filter((alert) => typeof alert.alertId === "string")
        .map((alert) => [alert.alertId as string, alert]),
    );

    const seen = new Set<string>();
    const resolved: AlertFields[] = [];

    for (const id of ids) {
      const alert = byId.get(id);
      if (alert && matchesStatus(alert, status) && !seen.has(id)) {
        resolved.push(alert);
        seen.add(id);
      }
    }

    if (status === "active") {
      // New alerts arrive over Ably before they appear in a fetched page.
      for (const alert of alerts) {
        const id = alert.alertId;
        if (id && !seen.has(id) && matchesStatus(alert, status)) {
          resolved.push(alert);
          seen.add(id);
        }
      }
    }

    return resolved.sort(
      (a, b) => alertTimeValue(b.timeStamp) - alertTimeValue(a.timeStamp),
    );
  }, [alerts, ids, status]);

  return {
    visibleAlerts,
    isRefreshing,
    isLoadingMore,
    hasMore: hasMoreRef.current,
    refresh,
    loadMore,
  };
}
