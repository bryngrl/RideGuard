import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import {
  FALSE_ALARM_ERROR_MESSAGE,
  FALSE_ALARM_ERROR_TITLE,
} from "../constants";
import {
  markAlertAsFalseAlarm,
  markAlertAsSeen,
} from "../services/alerts.api";
import { useAlertsStore } from "../store/alerts.store";

/**
 * Owns the logic for the alert details screen: finding the alert from the store
 * and submitting the "mark as false alarm" request. The screen just renders it.
 */
export function useAlertDetails() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const alert = useAlertsStore((state) =>
    state.alerts.find((item) => item.alertId === alertId),
  );
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remember which alert we've already marked seen, so opening the screen only
  // fires the request once.
  const markedSeenRef = useRef<string | null>(null);

  // Opening an unread alert marks it as seen. We update the store with the
  // backend result so the row loses its unread background + dot, and that state
  // sticks when navigating back (it's persisted on the server too).
  useEffect(() => {
    if (!user || !alertId || !alert) return;
    if (alert.isSeen) return;
    if (markedSeenRef.current === alertId) return;

    markedSeenRef.current = alertId;
    let active = true;

    (async () => {
      try {
        const token = await user.getIdToken();
        const updated = await markAlertAsSeen(alertId, token);
        if (active) upsertAlert(updated);
      } catch (error) {
        console.error("Failed to mark alert as seen:", error);
        // Let a later open retry if this one failed.
        if (markedSeenRef.current === alertId) {
          markedSeenRef.current = null;
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user, alertId, alert, upsertAlert]);

  const markAsFalseAlarm = async () => {
    if (!user || !alertId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();
      const updated = await markAlertAsFalseAlarm(alertId, token);
      // Update the same stored alert; the row/detail now reads "All clear".
      upsertAlert(updated);
    } catch (error) {
      // On failure keep the current status untouched (we never mutated it).
      Alert.alert(
        FALSE_ALARM_ERROR_TITLE,
        error instanceof Error ? error.message : FALSE_ALARM_ERROR_MESSAGE,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the full-screen photo viewer for this alert.
  const openPhoto = () => {
    if (!alertId) return;
    router.push({
      pathname: "/alerts/[alertId]/photo",
      params: { alertId },
    });
  };

  return { alert, isSubmitting, markAsFalseAlarm, openPhoto };
}
