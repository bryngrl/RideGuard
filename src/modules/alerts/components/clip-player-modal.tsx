import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppModal as Modal } from "@/shared/ui/app-modal";

import { Spacing, Typography } from "@/shared/theme";

interface ClipPlayerModalProps {
  /** The alert's clip URL. Mount this component only while there is one. */
  uri: string;
  onClose: () => void;
}

/**
 * Full-screen playback for an alert's violence clip. Mounted only while open,
 * so the player (and its native resources) is created on open and released on
 * close, instead of toggling a `visible` prop on a component that stays
 * mounted. Autoplays once on open; no loop, no autoplay from the alerts list.
 */
export function ClipPlayerModal({ uri, onClose }: ClipPlayerModalProps) {
  const player = useVideoPlayer(uri);
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });

  useEffect(() => {
    player.play();
  }, [player]);

  useEffect(() => {
    if (status === "error" && error) {
      console.error("Clip playback failed:", error.message);
    }
  }, [status, error]);

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls
          contentFit="contain"
        />

        {status === "loading" || status === "idle" ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        ) : null}

        {status === "error" ? (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>Couldn't play this clip.</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close clip"
          hitSlop={8}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  video: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  errorText: {
    ...Typography.body,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: Spacing.four,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.four,
    right: Spacing.three,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 24,
  },
});
