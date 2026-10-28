import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";

/** Block protected content without treating a backend outage as a logout. */
export function SessionRecovery({ message, busy, onRetry }: {
  message: string | null; busy: boolean; onRetry: () => void;
}) {
  const theme = useTheme();
  const visible = !!message;
  return <View collapsable={false} pointerEvents={visible ? "auto" : "none"}
    accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
    accessibilityViewIsModal={visible}
    style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: visible ? 1 : 0, justifyContent: "center", padding: Spacing.five }]}>
    <View style={{ width: "100%", maxWidth: 440, alignSelf: "center", gap: Spacing.four }}>
      <Text accessibilityRole="header" style={[Typography.h3, { color: theme.text }]}>Reconnect to RideGuard</Text>
      {message && <FormFeedback message={message} />}
      <Button title="Retry" onPress={onRetry} isLoading={busy} />
    </View>
  </View>;
}
