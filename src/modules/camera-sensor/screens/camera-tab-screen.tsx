import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { QuickActions } from "@/shared/ui/quick-actions";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LiveCameraView } from "../components/live-camera-view";
import { useCameras } from "../hooks/use-cameras";

export function CameraTabScreen() {
  const colors = useTheme();
  const { cameras, isLoading, error } = useCameras();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text style={[Typography.largeTitle, { color: colors.text }]}>
          Live camera
        </Text>

        {isLoading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.text} />
          </View>
        ) : error ? (
          <View style={styles.statusBox}>
            <Text style={[Typography.body, { color: colors.text }]}>
              {error}
            </Text>
          </View>
        ) : cameras.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={[Typography.body, { color: colors.text }]}>
              No cameras linked to your account yet.
            </Text>
          </View>
        ) : (
          <View style={styles.cameraList}>
            {cameras.map((camera, index) => (
              <LiveCameraView
                key={camera.deviceId}
                camera={camera}
                label={`Camera ${index + 1}`}
              />
            ))}
          </View>
        )}
      </KeyboardAvoidingWrapper>

      <QuickActions />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
  },
  statusBox: {
    marginTop: Spacing.six,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.six,
  },
  cameraList: {
    marginTop: Spacing.six,
    gap: 0,
    marginHorizontal: -Spacing.five,
  },
});
