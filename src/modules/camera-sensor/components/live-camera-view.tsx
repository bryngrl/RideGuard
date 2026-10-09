import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { LiveCamera } from "../types/live-camera.types";

// The model API holds the newest frame per device in memory. Polling it a
// couple of times a second approximates a live stream and works from anywhere,
// since the server is public (no shared network needed).
const INFERENCE_BASE_URL =
  process.env.EXPO_PUBLIC_INFERENCE_BASE_URL || "http://3.26.225.222:8000/v1";
const POLL_INTERVAL_MS = 500;

function relayUrl(deviceId: string, tick: number): string {
  // tick busts any cache so each poll gets the current frame.
  return `${INFERENCE_BASE_URL}/stream/${encodeURIComponent(deviceId)}/latest.jpg?t=${tick}`;
}

export function LiveCameraView({
  camera,
  label,
}: {
  camera: LiveCamera;
  label: string;
}) {
  const [tick, setTick] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);

  // Only poll while the camera is reporting. A stopped camera just shows the
  // offline state instead of hammering the relay for 404s.
  useEffect(() => {
    if (!camera.online) return;

    const id = setInterval(() => setTick(Date.now()), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [camera.online]);

  // Live only when the camera is reporting and the last frame loaded. The Image
  // stays mounted while online and keeps polling, so onLoad can clear a
  // transient failure on its own once frames resume.
  const isLive = camera.online && !failed;

  return (
    <View style={styles.container}>
      {camera.online ? (
        <Image
          style={styles.media}
          source={{ uri: relayUrl(camera.deviceId, tick) }}
          cachePolicy="none"
          contentFit="cover"
          transition={0}
          onError={() => setFailed(true)}
          onLoad={() => setFailed(false)}
        />
      ) : (
        <View style={[styles.media, styles.placeholder]}>
          <Text style={styles.placeholderText}>Camera offline</Text>
        </View>
      )}

      {camera.online && failed ? (
        <View style={[styles.media, styles.placeholder, styles.overlay]}>
          <Text style={styles.placeholderText}>Stream unavailable</Text>
        </View>
      ) : null}

      <View style={styles.label}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.labelDot,
              { backgroundColor: isLive ? BrandColors.error : "#9CA3AF" },
            ]}
          />
          <Text style={[Typography.h3, styles.labelText]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    backgroundColor: "#D9D9D9",
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderText: {
    color: "#FFFFFF",
    ...Typography.h3,
  },
  label: {
    left: Spacing.two,
    position: "absolute",
    top: Spacing.two,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  labelDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  labelText: {
    padding: Spacing.two,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
