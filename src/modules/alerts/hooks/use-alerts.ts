import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { ALERTS_PAGE_SIZE, LOADED_MESSAGE_DURATION_MS } from "../constants";
import { getSavedAlerts } from "../services/alerts.api";
import {
  alertTimeValue,
  mapAlertFieldsToItem,
} from "../services/alerts.mapper";
import { useAlertsStore } from "../store/alerts.store";
import type { AlertItem } from "../types/alert.types";

export type AlertFilter = "all" | "unread";

/**
 * Owns all the logic for the alerts list screen: loading pages, the All/Unread
 * filter, the "loading more / loaded" footer state, and opening an alert.
 * The screen just renders whatever this returns.
 */
export function useAlerts() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const alerts = useAlertsStore((state) => state.alerts);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);

  const [filter, setFilter] = useState<AlertFilter>("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoadedMessage, setShowLoadedMessage] = useState(false);

  // Pagination bookkeeping kept in refs so the loader stays stable across pages.
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const initializedUidRef = useRef<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAlerts = useCallback(
    async (mode: "initial" | "more") => {
      if (!user || isFetchingRef.current) return;
      if (mode === "more" && (!hasMoreRef.current || !cursorRef.current))
        return;

      isFetchingRef.current = true;
      if (mode === "more") setIsLoadingMore(true);

      try {
        const token = await user.getIdToken();
        const page = await getSavedAlerts(token, {
          limit: ALERTS_PAGE_SIZE,
          cursor:
            mode === "more" ? (cursorRef.current ?? undefined) : undefined,
        });

        // Merge by alertId so realtime updates and earlier pages aren't clobbered.
        mergeAlerts(page.alerts);
        cursorRef.current = page.nextCursor;
        hasMoreRef.current = page.nextCursor !== null;

        if (mode === "more") {
          setShowLoadedMessage(true);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(
            () => setShowLoadedMessage(false),
            LOADED_MESSAGE_DURATION_MS,
          );
        }
      } catch (error) {
        console.error("Failed to load saved alerts:", error);
      } finally {
        isFetchingRef.current = false;
        if (mode === "more") setIsLoadingMore(false);
      }
    },
    [user, mergeAlerts],
  );

  // Initial page load, once per signed-in user. Guarding on uid prevents the
  // effect from re-firing (and re-fetching page 1) when the Firebase user
  // reference changes on token refresh.
  useEffect(() => {
    if (!user) {
      initializedUidRef.current = null;
      return;
    }

    if (initializedUidRef.current === user.uid) return;
    initializedUidRef.current = user.uid;

    cursorRef.current = null;
    hasMoreRef.current = true;
    loadAlerts("initial");
  }, [user, loadAlerts]);

  // Clear any pending success-message timer on unmount.
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Load the next page as the list nears its end. The cursor / in-flight guards
  // inside loadAlerts prevent over-fetching and duplicate requests.
  const handleEndReached = useCallback(() => {
    loadAlerts("more");
  }, [loadAlerts]);

  const visibleAlerts = useMemo(() => {
    const items = [...alerts]
      .sort((a, b) => alertTimeValue(b.timeStamp) - alertTimeValue(a.timeStamp))
      .map(mapAlertFieldsToItem)
      .filter((item): item is AlertItem => item !== null);

    return filter === "unread" ? items.filter((item) => !item.read) : items;
  }, [alerts, filter]);

  const openAlertDetails = useCallback(
    (item: AlertItem) => {
      router.push({
        pathname: "/alerts/[alertId]",
        params: { alertId: item.alertId },
      });
    },
    [router],
  );

  return {
    visibleAlerts,
    filter,
    setFilter,
    isLoadingMore,
    showLoadedMessage,
    handleEndReached,
    openAlertDetails,
  };
}
