import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

import {
  ALERT_ICON,
  ALERT_TITLE,
  AUTO_DELETE_COUNTDOWN_LABEL,
  AUTO_DELETE_RETENTION_HOURS,
} from "../constants";
import { useAlertDetails } from "../hooks/use-alert-details";
import { formatClockTime, formatRelativeDay } from "../services/alerts.mapper";

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

  // Only threats can be flagged; a cleared alert has no action button.
  const footer = isThreat ? (
    <Button
      title={isSubmitting ? "Submitting…" : "Flag as false alarm"}
      variant="primary"
      size="lg"
      onPress={markAsFalseAlarm}
      isLoading={isSubmitting}
      disabled={isSubmitting}
      style={[styles.flagButton, { backgroundColor: colors.error }]}
    />
  ) : undefined;

  return (
    <PageLayout title="Alert details" footer={footer}>
      {/* TITLE + TIME */}
      <View style={styles.titleRow}>
        <Text style={[Typography.h2, styles.title, { color: titleColor }]}>
          {title}
        </Text>
        <Text style={[Typography.bodyLarge, { color: colors.textMuted }]}>
          {formatClockTime(alert.timeStamp)}
        </Text>
      </View>
      <Text
        style={[Typography.bodyLarge, styles.day, { color: colors.textMuted }]}
      >
        {formatRelativeDay(alert.timeStamp)}
      </Text>

      {/* IMAGE (single) */}
      {alert.imageUrl ? (
        <Image
          source={alert.imageUrl}
          style={[styles.image, { backgroundColor: colors.backgroundElement }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Text style={[Typography.body, { color: colors.textMuted }]}>
            No image available
          </Text>
        </View>
      )}

      {/* AUTO-DELETE CARD (static) */}
      <View
        style={[
          styles.autoDeleteCard,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name={ALERT_ICON.AUTO_DELETE}
          size={22}
          color={colors.textMuted}
        />
        <View style={styles.autoDeleteText}>
          <Text style={[Typography.medium, { color: colors.text }]}>
            Auto-deletes in {AUTO_DELETE_COUNTDOWN_LABEL}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
            Viewable in-app only for {AUTO_DELETE_RETENTION_HOURS}, then
            automatically deleted.
          </Text>
          <Text
            style={[
              Typography.bodySmall,
              styles.link,
              { color: colors.accent },
            ]}
          >
            Change
          </Text>
        </View>
      </View>

      {/* RESPONSE (static) */}
      <Text
        style={[Typography.h3, styles.responseHeading, { color: colors.text }]}
      >
        Response
      </Text>
      <View style={styles.responseRow}>
        <Ionicons
          name={ALERT_ICON.RESPONSE_INFO}
          size={20}
          color={colors.textMuted}
        />
        <Text style={[Typography.body, { color: colors.textMuted }]}>
          No emergency contacts were notified.
        </Text>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  day: {
    marginTop: Spacing.half,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    marginTop: Spacing.four,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  autoDeleteCard: {
    flexDirection: "row",
    gap: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  autoDeleteText: {
    flex: 1,
    gap: Spacing.half,
  },
  link: {
    marginTop: Spacing.one,
    fontWeight: "600",
  },
  responseHeading: {
    marginTop: Spacing.five,
  },
  responseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  flagButton: {
    borderRadius: 9999,
  },
});
