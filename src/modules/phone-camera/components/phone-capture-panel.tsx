import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";

import type { PhoneCaptureStatus } from "../../../../modules/phone-capture";
import type { PhoneCapture } from "../hooks/use-phone-capture";

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Only messages the preview frame cannot show. Progress (starting, connecting,
 * capturing, uploading) is shown in the frame, and a plain Stop needs none.
 */
function phoneStatusText(status: PhoneCaptureStatus | null): string | null {
  switch (status?.state) {
    case "interrupted":
      return status.reason ?? "Camera interrupted.";
    case "completed":
      return "Session completed";
    case "stopped":
      return status.reason;
    case "error":
      return status.reason ?? "Phone camera stopped because of an error.";
    default:
      return null;
  }
}

export function isPhoneActive(capture: PhoneCapture): boolean {
  return capture.status?.active === true || capture.status?.state === "starting";
}

/** Capture status, lens flip and Start/Stop for the phone source. */
export function PhoneCapturePanel({ capture }: { capture: PhoneCapture }) {
  const colors = useTheme();
  const { status } = capture;
  const active = isPhoneActive(capture);
  const canStart = Boolean(capture.deviceId) && capture.lenses.length > 0;
  const otherLens = capture.lenses.find((option) => option !== capture.lens);
  const message = phoneStatusText(status);

  return (
    <View style={styles.container}>
      {message ? (
        <Text style={[Typography.body, { color: colors.textMuted }]}>
          {message}
        </Text>
      ) : null}

      {status?.active && !status.notificationsAllowed ? (
        <Text style={[Typography.bodySmall, { color: BrandColors.warning }]}>
          Notifications are off, so the capture notification is hidden. Stop
          capture from this screen.
        </Text>
      ) : null}

      {capture.error ? (
        <Text style={[Typography.bodySmall, { color: BrandColors.error }]}>
          {capture.error}
        </Text>
      ) : null}

      {capture.needsSettings ? (
        <Button
          title="Open settings"
          variant="outline"
          onPress={() => Linking.openSettings()}
        />
      ) : null}

      <View style={styles.actions}>
        {otherLens ? (
          // The lens is fixed for a running session.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${otherLens === "front" ? "front" : "back"} camera`}
            disabled={active}
            onPress={() => capture.setLens(otherLens)}
            style={({ pressed }) => [
              styles.flipButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                opacity: active ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={20}
              color={colors.text}
            />
          </Pressable>
        ) : null}

        <Button
          title={active ? "Stop camera" : "Start camera"}
          size="md"
          variant={active ? "danger" : "primary"}
          fullWidth={false}
          style={styles.startButton}
          isLoading={capture.isBusy}
          disabled={!active && !canStart}
          onPress={active ? capture.stop : capture.start}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  flipButton: {
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  startButton: {
    flex: 1,
  },
});
