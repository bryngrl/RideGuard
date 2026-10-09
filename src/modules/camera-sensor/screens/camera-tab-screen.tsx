import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { QuickActions } from "@/shared/ui/quick-actions";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, CameraViewMedia } from "../components/camera-view";

const cameras: CameraViewMedia[] = [
  {
    id: "camera-1",
    label: "Camera 1",
    mediaType: "image",
    // TODO: Map this camera ID to the backend/ESP32 image or live-stream source.
    source: require("@/assets/images/placeholder/placeholder-camera-preview.png"),
  },
  {
    id: "camera-2",
    label: "Camera 2",
    mediaType: "image",
    // TODO: Map this camera ID to the backend/ESP32 image or live-stream source.
    source: require("@/assets/images/placeholder/placeholder-camera-preview.png"),
  },
];

export function CameraTabScreen() {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text style={[Typography.largeTitle, { color: colors.text }]}>
          Live camera
        </Text>
        <View style={styles.cameraList}>
          {cameras.map((camera) => (
            <CameraView key={camera.id} camera={camera} />
          ))}
        </View>
      </KeyboardAvoidingWrapper>

      <QuickActions />
      <BottomNavigation />
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
  cameraList: {
    marginTop: Spacing.six,
    gap: 0,
    marginHorizontal: -Spacing.five,
  },
});
