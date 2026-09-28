import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

import { ALERT_TITLE } from "../constants";
import { useAlertDetails } from "../hooks/use-alert-details";
import { formatAlertTime } from "../services/alerts.mapper";

export function AlertDetailsScreen() {
  const colors = useTheme();
  const { alert, isSubmitting, markAsFalseAlarm } = useAlertDetails();

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
  const title = isThreat ? ALERT_TITLE.THREAT : ALERT_TITLE.CLEAR;
  const titleColor = isThreat ? colors.error : colors.text;

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
        {formatAlertTime(alert.timeStamp) || "Unknown time"}
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
            onPress={markAsFalseAlarm}
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
