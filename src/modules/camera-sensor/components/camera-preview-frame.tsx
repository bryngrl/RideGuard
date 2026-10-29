import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import type { LiveCamera } from "../types/live-camera.types";
import { LiveCameraView } from "./live-camera-view";

/** Shared preview surface for the Camera tab and each hardware setup slot. */
export function CameraPreviewFrame({ children, dashed = false }: { children: ReactNode; dashed?: boolean }) {
  const colors = useTheme();
  return <View style={[styles.frame, { backgroundColor: colors.backgroundElement,
    borderColor: dashed ? colors.textInactive : colors.border, borderStyle: dashed ? "dashed" : "solid" }]}>{children}</View>;
}

export function CameraPreviewPlaceholder({ icon, iconColor, onIconPress, title, body, onConnect }: {
  icon: ComponentProps<typeof Ionicons>["name"]; iconColor?: string; onIconPress?: () => void; title: string; body?: string;
  onConnect?: () => void;
}) {
  const colors = useTheme();
  return <View style={styles.placeholder}>
    <Pressable accessibilityRole={onIconPress ? "button" : undefined} accessibilityLabel={onIconPress ? title : undefined}
      disabled={!onIconPress} onPress={onIconPress} style={[styles.iconTile, { backgroundColor: colors.backgroundSelected }]}>
      <Ionicons name={icon} size={28} color={iconColor ?? colors.text} />
    </Pressable>
    <Text style={[Typography.h3, styles.center, { color: colors.text }]}>{title}</Text>
    {body ? <Text style={[Typography.body, styles.center, { color: colors.textMuted }]}>{body}</Text> : null}
    {onConnect ? <Button title="Connect" size="sm" fullWidth={false} onPress={onConnect} /> : null}
  </View>;
}

/** Uses only the selected hardware ID: no phone registration or source picker. */
export function HardwareCameraPreview({ camera, label, loading = false, error, onConnect }: {
  camera?: LiveCamera; label: string; loading?: boolean; error?: string | null;
  onConnect?: () => void;
}) {
  const colors = useTheme();
  if (loading) return <ActivityIndicator color={colors.text} accessibilityLabel="Loading camera preview" />;
  if (error) return <CameraPreviewPlaceholder icon="videocam-off-outline" title="Camera unavailable" body="Check your connection and try again." />;
  if (!camera) return <CameraPreviewPlaceholder icon="videocam-outline" title={`${label} is not linked`} body="Connect this camera to preview its angle." onConnect={onConnect} />;
  if (!camera.online) return <CameraPreviewPlaceholder icon="videocam-off-outline" title={`${label} is offline`}
    body="The preview will appear here as soon as the camera comes online." onConnect={onConnect} />;
  return <LiveCameraView key={camera.deviceId} camera={camera} label={label} />;
}

const styles = StyleSheet.create({
  frame: { alignItems: "center", flex: 1, minHeight: 160, borderRadius: BorderRadius.xl + Spacing.one,
    borderWidth: 1, justifyContent: "center", overflow: "hidden", width: "100%" },
  placeholder: { alignItems: "center", gap: Spacing.two, paddingHorizontal: Spacing.five },
  center: { textAlign: "center" },
  iconTile: { alignItems: "center", borderRadius: BorderRadius.lg, height: 64, width: 64,
    marginBottom: Spacing.two, justifyContent: "center" },
});
