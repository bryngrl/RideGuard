import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import {
  FALSE_ALARM_ERROR_MESSAGE,
  FALSE_ALARM_ERROR_TITLE,
} from "../constants";
import { markAlertAsFalseAlarm } from "../services/alerts.api";
import { useAlertsStore } from "../store/alerts.store";

/**
 * Owns the logic for the alert details screen: finding the alert from the store
 * and submitting the "mark as false alarm" request. The screen just renders it.
 */
export function useAlertDetails() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  const user = useAuthStore((state) => state.user);
  const alert = useAlertsStore((state) =>
    state.alerts.find((item) => item.alertId === alertId),
  );
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return { alert, isSubmitting, markAsFalseAlarm };
}
