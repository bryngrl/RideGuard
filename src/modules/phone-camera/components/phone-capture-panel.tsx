import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { LiveCameraView } from "@/modules/camera-sensor/components/live-camera-view";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";

import type { PhoneCaptureStatus } from "../../../../modules/phone-capture";
import { usePhoneCapture } from "../hooks/use-phone-capture";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function statusText(status: PhoneCaptureStatus | null): string {
  switch (status?.state) {
    case "starting":
      return "Starting…";
    case "connecting":
      return "Connecting to the server…";
    case "capturing":
      return "Camera on. Waiting for the server to confirm frames.";
    case "uploading":
      return `Uploading. Server received ${status.serverReceived} frames.`;
    case "interrupted":
      return status.reason ?? "Camera interrupted.";
    case "completed":
      return "Session completed";
    case "stopped":
      return status.reason ?? "Stopped";
    case "error":
      return status.reason ?? "Phone camera stopped because of an error.";
    default:
      return "Not capturing";
  }
}

export function PhoneCapturePanel() {
  const colors = useTheme();
  const capture = usePhoneCapture();
  const { status } = capture;
  const active = status?.active === true || status?.state === "starting";

  if (!capture.supported) {
    return (
      <View style={styles.container}>
        <Text style={[Typography.h3, { color: colors.text }]}>Phone camera</Text>
        <Text style={[Typography.body, { color: colors.textMuted }]}>
          Install the latest app build to use your phone as a camera.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[Typography.h3, { color: colors.text }]}>Phone camera</Text>

      {active && capture.deviceId ? (
        <View style={styles.preview}>
          {/* The server's view of this phone. It can close while capture
              keeps running in the background. */}
          <LiveCameraView
            camera={{
              deviceId: capture.deviceId,
              streamUrl: null,
              online: status?.connected === true,
              lastSeenAt: null,
              source: "phone",
            }}
            label="Phone"
          />
        </View>
      ) : null}

      <View style={styles.lensRow}>
        {capture.lenses.map((option) => {
          const selected = capture.lens === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: active }}
              disabled={active}
              onPress={() => capture.setLens(option)}
              style={[
                styles.lensOption,
                {
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.backgroundSelected : colors.card,
                  opacity: active && !selected ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[Typography.button, { color: colors.text }]}>
                {option === "front" ? "Front" : "Rear"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[Typography.body, { color: colors.text }]}>
        {statusText(status)}
      </Text>

      {status?.active ? (
        <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
          {formatRemaining(capture.remainingMs)} left · {status.framesSent} sent
          {status.framesDropped > 0 ? ` · ${status.framesDropped} skipped` : ""}
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

      {active ? (
        <Button title="Stop" variant="danger" onPress={capture.stop} />
      ) : (
        <Button
          title="Start phone camera"
          onPress={capture.start}
          isLoading={capture.isBusy}
          disabled={!capture.deviceId || capture.lenses.length === 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  preview: {
    marginHorizontal: -Spacing.five,
  },
  lensRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  lensOption: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
});
