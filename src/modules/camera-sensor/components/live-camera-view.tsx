import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { LiveCamera } from "../types/live-camera.types";

/**
 * Wraps the MJPEG stream in a full-bleed <img>. A browser/WebView renders a
 * multipart/x-mixed-replace response as a continuously updating image, so this
 * is all it takes to play the feed. onerror reports back so we can show a
 * "stream unavailable" state instead of a blank frame.
 */
function buildStreamHtml(streamUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    </style>
  </head>
  <body>
    <img
      src="${streamUrl}"
      onerror="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error')"
    />
  </body>
</html>`;
}

function streamOrigin(streamUrl: string): string {
  const match = streamUrl.match(/^[a-z]+:\/\/[^/]+/i);
  return match ? match[0] : streamUrl;
}

export function LiveCameraView({
  camera,
  label,
}: {
  camera: LiveCamera;
  label: string;
}) {
  const [streamFailed, setStreamFailed] = useState(false);

  const canStream = camera.online && !!camera.streamUrl && !streamFailed;

  const html = useMemo(
    () => (camera.streamUrl ? buildStreamHtml(camera.streamUrl) : ""),
    [camera.streamUrl],
  );

  return (
    <View style={styles.container}>
      {canStream && camera.streamUrl ? (
        <WebView
          style={styles.media}
          originWhitelist={["*"]}
          // The stream is plain HTTP on the LAN; allow it to load.
          mixedContentMode="always"
          source={{ html, baseUrl: streamOrigin(camera.streamUrl) }}
          onMessage={(event) => {
            if (event.nativeEvent.data === "error") setStreamFailed(true);
          }}
          scrollEnabled={false}
          javaScriptEnabled
        />
      ) : (
        <View style={[styles.media, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            {camera.online ? "Stream unavailable" : "Camera offline"}
          </Text>
        </View>
      )}

      <View style={styles.label}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.labelDot,
              { backgroundColor: canStream ? BrandColors.error : "#9CA3AF" },
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
