import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { ALERTS_PAGE_SIZE } from "../constants";
import { getSavedAlerts } from "../services/alerts.api";
import { alertTimeValue } from "../services/alerts.mapper";
import { useAlertsStore } from "../store/alerts.store";
import type { AlertFields } from "../types/alert.types";

// The backend returns both archive states. "unread" filters active alerts
// locally, not through a separate backend status.
export type AlertListStatus = "active" | "archived";

// Refetch the visible list this often while the screen is focused, so a change
// made on another device (or the background archive pass) shows up without the
// user doing anything. Matches the ~60s backend pass cadence.
const VISIBLE_REFRESH_MS = 60_000;

/** True when an entity belongs in the selected view. */
function matchesStatus(alert: AlertFields, status: AlertListStatus): boolean {
  if (alert.isFalseAlarm) return false;
  return status === "archived" ? alert.isArchived : !alert.isArchived;
}

/**
 * Owns one view's list: it pages through saved alerts, keeps its own
 * pagination cursor and ordered membership, and
 * refreshes on focus, on foreground, every 60s while visible, and whenever the
 * auto-archive preference changes. Membership uses the returned isArchived
 * field, so an alert that moves lists drops out on refresh; a brand-new
 * realtime alert is still shown immediately on the active list.
 *
 * The store holds alert *entities* (so seen/false-alarm/archive updates reflect
 * live); this hook holds the ordered IDs for its status.
 */
export function useAlertsList(status: AlertListStatus, enabled = true) {
  const user = useAuthStore((state) => state.user);
  const alerts = useAlertsStore((state) => state.alerts);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);
  const listRefreshNonce = useAlertsStore((state) => state.listRefreshNonce);

  // IDs matching this view, in page order.
  const [ids, setIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedStatuses, setLoadedStatuses] = useState<Set<AlertListStatus>>(new Set());

  const cursorRef = useRef<string | null>(null);
  const cursorStatusRef = useRef(status);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const fetchingStatusRef = useRef<AlertListStatus | null>(null);
  const requestIdRef = useRef(0);
  const currentStatusRef = useRef(status);
  currentStatusRef.current = status;
  const currentUserRef = useRef(user);
  currentUserRef.current = user;

  useEffect(() => () => {
    // Home also consumes this hook: a request may outlive a tab or account.
    requestIdRef.current += 1;
    isFetchingRef.current = false;
    fetchingStatusRef.current = null;
  }, [user]);

  // Invalidate a pending live response when a development preview is selected.
  useEffect(() => {
    if (enabled) return;
    requestIdRef.current += 1;
    isFetchingRef.current = false;
    fetchingStatusRef.current = null;
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [enabled]);

  const fetchPage = useCallback(
    async (mode: "reset" | "more") => {
      if (!enabled || !user || (isFetchingRef.current && fetchingStatusRef.current === status)) return;
      if (mode === "more" && cursorStatusRef.current !== status) return;
      if (mode === "more" && (!hasMoreRef.current || !cursorRef.current)) return;

      const requestId = ++requestIdRef.current;
      isFetchingRef.current = true;
      fetchingStatusRef.current = status;
      if (mode === "reset") {
        setError(null);
        cursorStatusRef.current = status;
        cursorRef.current = null;
        hasMoreRef.current = true;
        setIsRefreshing(true);
      }
      else setIsLoadingMore(true);

      try {
        const token = await user.getIdToken();
        if (requestIdRef.current !== requestId || currentUserRef.current?.uid !== user.uid) return;
        const pageIds: string[] = [];
        let cursor = mode === "more" ? cursorRef.current : null;
        let nextCursor: string | null = null;

        // The API does not accept a status query. Continue through its pages
        // until this view has enough matches or there are no more records.
        do {
          const page = await getSavedAlerts(token, {
            limit: ALERTS_PAGE_SIZE,
            cursor: cursor ?? undefined,
          });
          if (!enabled || requestIdRef.current !== requestId || currentStatusRef.current !== status || currentUserRef.current?.uid !== user.uid) return;

          mergeAlerts(page.alerts);
          pageIds.push(
            ...page.alerts
              .filter((alert) => matchesStatus(alert, status))
              .map((alert) => alert.alertId)
              .filter((id): id is string => typeof id === "string"),
          );
          nextCursor = page.nextCursor === cursor ? null : page.nextCursor;
          cursor = nextCursor;
        } while (pageIds.length < ALERTS_PAGE_SIZE && nextCursor);

        setIds((previous) =>
          mode === "reset"
            ? pageIds
            : [...previous, ...pageIds.filter((id) => !previous.includes(id))],
        );

        cursorRef.current = nextCursor;
        hasMoreRef.current = nextCursor !== null;
      } catch (error) {
        if (requestIdRef.current === requestId) setError("Couldn't load alerts.");
        console.info(`[Alerts] ${status} alerts unavailable; retry on refresh.`);
      } finally {
        if (requestIdRef.current === requestId) {
          isFetchingRef.current = false;
          fetchingStatusRef.current = null;
          if (mode === "reset") setIsRefreshing(false);
          else setIsLoadingMore(false);
          if (mode === "reset") {
            setLoadedStatuses((previous) => {
              if (previous.has(status)) return previous;
              const next = new Set(previous);
              next.add(status);
              return next;
            });
          }
        }
      }
    },
    [enabled, user, status, mergeAlerts],
  );

  const refresh = useCallback(() => {
    void fetchPage("reset");
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    void fetchPage("more");
  }, [fetchPage]);

  // Refresh when the preference changes (the save screen bumps the nonce).
  useEffect(() => {
    if (!enabled || !user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user, status, listRefreshNonce]);

  // Focus + foreground + periodic refresh, all bounded to "while this screen is
  // visible": the interval and AppState listener are set up on focus and torn
  // down on blur.
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      refresh();

      const interval = setInterval(refresh, VISIBLE_REFRESH_MS);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") refresh();
      });

      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [enabled, refresh]),
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
    error,
    isInitialLoading: enabled && Boolean(user) && !loadedStatuses.has(status),
    hasMore: hasMoreRef.current,
    refresh,
    loadMore,
  };
}
