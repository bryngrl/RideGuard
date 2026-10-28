import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { FeedbackPressable } from "./feedback-pressable";

export function EmailLinkContent({ instruction, status, onResend, seconds = 0, sending = false,
  disabled = false, waiting = true, action = "Didn't receive the email?" }: {
  instruction: string;
  status: string;
  onResend: () => void;
  seconds?: number;
  sending?: boolean;
  disabled?: boolean;
  waiting?: boolean;
  action?: string;
}) {
  const theme = useTheme();
  const unavailable = disabled || sending || seconds > 0;
  return <View style={styles.body}>
    <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>{instruction}</Text>
    <View style={styles.status} accessibilityLiveRegion="polite">
      {waiting && <ActivityIndicator size="small" color={theme.accent} />}
      <Text style={[Typography.caption, styles.statusText, { color: theme.textMuted }]}>{status}</Text>
    </View>
    <FeedbackPressable onPress={onResend} disabled={unavailable} accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: sending }} style={styles.link}>
      <Text style={[Typography.bodySmall, { color: theme.accent, opacity: unavailable ? 0.5 : 1 }]}>
        {sending ? "Sending..." : seconds ? `${action} (${seconds}s)` : action}
      </Text>
    </FeedbackPressable>
  </View>;
}

const styles = StyleSheet.create({
  body: { gap: Spacing.four, marginTop: Spacing.four },
  status: { alignSelf: "center", alignItems: "center", gap: Spacing.two },
  statusText: { textAlign: "center", maxWidth: 280 },
  link: { alignSelf: "center", padding: Spacing.two },
});
