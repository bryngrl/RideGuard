import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

import { markAlertAsFalseAlarm } from "../services/alerts.api";
import { useAlertsStore } from "../store/alerts.store";

function formatTimestamp(timeStamp: string): string {
  if (!timeStamp) return "Unknown time";
  const date = new Date(timeStamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AlertDetailsScreen() {
  const colors = useTheme();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  const user = useAuthStore((state) => state.user);
  const alert = useAlertsStore((state) =>
    state.alerts.find((item) => item.alertId === alertId),
  );
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) {
    return (
      <PageLayout title="Alert details">
        <Text style={[Typography.bodyLarge, { color: colors.textMuted }]}>
          This alert is no longer available.
        </Text>
      </PageLayout>
    );
  }

  const isThreat = !alert.isFalseAlarm;
  const title = alert.isFalseAlarm ? "All clear" : "Threat detected";
  const titleColor = isThreat ? colors.error : colors.text;

  const handleMarkFalseAlarm = async () => {
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
        "Couldn't update alert",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="Alert details">
      <Text style={[Typography.largeTitle, { color: titleColor }]}>{title}</Text>

      <Text
        style={[
          Typography.bodyLarge,
          styles.timestamp,
          { color: colors.textMuted },
        ]}
      >
        {formatTimestamp(alert.timeStamp)}
      </Text>

      {/* Original backend message, preserved for the details view. */}
      <Text style={[Typography.body, styles.message, { color: colors.text }]}>
        {alert.message}
      </Text>

      {alert.imageUrl ? (
        <Image
          source={alert.imageUrl}
          style={[styles.image, { backgroundColor: colors.backgroundElement }]}
          contentFit="cover"
        />
      ) : null}

      {isThreat ? (
        <View style={styles.actions}>
          <Button
            title={isSubmitting ? "Submitting…" : "Mark as false alarm"}
            variant="danger"
            onPress={handleMarkFalseAlarm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      ) : null}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  timestamp: {
    marginTop: Spacing.one,
  },
  message: {
    marginTop: Spacing.four,
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.four,
  },
  actions: {
    marginTop: Spacing.five,
  },
});
