import { Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { AlertEvent } from "@/lib/ably/alerts";

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}

export function AlertListItem({ alert }: { alert: AlertEvent }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      {alert.imageUrl ? (
        <Image source={{ uri: alert.imageUrl }} style={styles.thumbnail} />
      ) : (
        <View
          style={[
            styles.thumbnail,
            { backgroundColor: theme.backgroundSelected },
          ]}
        />
      )}

      <View style={styles.body}>
        <ThemedText type="h4" numberOfLines={2}>
          {alert.message}
        </ThemedText>
        <ThemedText type="caption" themeColor="textMuted" style={styles.time}>
          {formatRelativeTime(alert.timeStamp)}
        </ThemedText>
      </View>

      {!alert.isSeen && (
        <View style={[styles.unseenDot, { backgroundColor: theme.accent }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  time: {
    marginTop: Spacing.half,
  },
  unseenDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
});
