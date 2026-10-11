import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { LiveCamera } from "../types/live-camera.types";

// The model API serves one held-open MJPEG stream per device. A WebView renders
// multipart/x-mixed-replace as live video, so the frame arrives as it is pushed
// instead of the client polling one JPEG at a time. Works from anywhere, since
// the server is public (no shared network needed).
const INFERENCE_BASE_URL =
  process.env.EXPO_PUBLIC_INFERENCE_BASE_URL || "http://3.26.225.222:8000/v1";

// The stream page is given this as its origin. Without a real http origin the
// WebView treats the http <img> as mixed content and blocks it, leaving a blank
// view. Matching the stream host makes the image same-origin, so it loads.
const STREAM_ORIGIN = INFERENCE_BASE_URL.match(/^https?:\/\/[^/]+/)?.[0] ?? "";

function streamUrl(deviceId: string): string {
  return `${INFERENCE_BASE_URL}/stream/${encodeURIComponent(deviceId)}/live.mjpeg`;
}

// The stream is shown full-bleed inside the WebView. object-fit: cover matches
// the old expo-image contentFit, and the black background fills letterboxing
// before the first frame lands.
function streamHtml(deviceId: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
  <body style="margin:0;background:#000;overflow:hidden">
    <img src="${streamUrl(deviceId)}" style="width:100vw;height:100vh;object-fit:cover" />
  </body>
</html>`;
}

export function LiveCameraView({
  camera,
  label,
}: {
  camera: LiveCamera;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  // Live only when the camera is reporting and the stream loaded.
  const isLive = camera.online && !failed;

  return (
    <View style={styles.container}>
      {camera.online ? (
        <WebView
          style={styles.media}
          originWhitelist={["*"]}
          // baseUrl gives the page a real http origin so the http <img> is not
          // blocked as mixed content.
          source={{ html: streamHtml(camera.deviceId), baseUrl: STREAM_ORIGIN }}
          // The stream is plain http, so allow it inside the WebView.
          mixedContentMode="always"
          // Lets you inspect the WebView from chrome://inspect while debugging.
          webviewDebuggingEnabled
          scrollEnabled={false}
          pointerEvents="none"
          onError={() => setFailed(true)}
          onLoadEnd={() => setFailed(false)}
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
