import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { LiveCamera } from "../types/live-camera.types";

// The model API serves one held-open MJPEG stream per device. Chromium (and so
// the Android WebView) does not reliably paint a multipart/x-mixed-replace
// stream in an <img> tag, so the page reads the stream itself: fetch the bytes,
// split out each JPEG frame, and swap the <img> via blob URLs. Works from
// anywhere, since the server is public (no shared network needed).
const INFERENCE_BASE_URL =
  process.env.EXPO_PUBLIC_INFERENCE_BASE_URL || "http://3.26.225.222:8000/v1";

// The stream page is given this as its origin so fetch() to the stream is
// same-origin and the plain-http request is not blocked as mixed content.
const STREAM_ORIGIN = INFERENCE_BASE_URL.match(/^https?:\/\/[^/]+/)?.[0] ?? "";

function streamUrl(deviceId: string): string {
  return `${INFERENCE_BASE_URL}/stream/${encodeURIComponent(deviceId)}/live.mjpeg`;
}

// Reads the MJPEG stream and renders each frame by hand. It scans the byte
// stream for JPEG start (FF D8) and end (FF D9) markers, so it does not depend
// on the browser understanding multipart boundaries. Posts "frame" on the first
// frame and "error:<msg>" if the stream fails, so React Native can update the
// live/offline state.
function streamHtml(deviceId: string): string {
  const url = streamUrl(deviceId);
  return `<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
  <body style="margin:0;background:#000;overflow:hidden">
    <img id="view" style="width:100vw;height:100vh;object-fit:cover" />
    <script>
      (function () {
        var img = document.getElementById("view");
        var buf = new Uint8Array(0);
        var current = null;
        var sawFrame = false;

        function post(msg) {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
        }

        function append(chunk) {
          var next = new Uint8Array(buf.length + chunk.length);
          next.set(buf, 0);
          next.set(chunk, buf.length);
          buf = next;
        }

        function drainFrames() {
          while (true) {
            var start = -1;
            for (var i = 0; i + 1 < buf.length; i++) {
              if (buf[i] === 0xff && buf[i + 1] === 0xd8) { start = i; break; }
            }
            if (start < 0) return;

            var end = -1;
            for (var j = start + 2; j + 1 < buf.length; j++) {
              if (buf[j] === 0xff && buf[j + 1] === 0xd9) { end = j + 1; break; }
            }
            if (end < 0) return;

            var frame = buf.slice(start, end + 1);
            buf = buf.slice(end + 1);

            var blobUrl = URL.createObjectURL(new Blob([frame], { type: "image/jpeg" }));
            img.src = blobUrl;
            if (current) URL.revokeObjectURL(current);
            current = blobUrl;

            if (!sawFrame) { sawFrame = true; post("frame"); }
          }
        }

        async function run() {
          try {
            var resp = await fetch("${url}");
            if (!resp.ok || !resp.body) throw new Error("status " + resp.status);
            var reader = resp.body.getReader();
            while (true) {
              var r = await reader.read();
              if (r.done) break;
              append(r.value);
              drainFrames();
            }
            post("error:stream ended");
          } catch (e) {
            post("error:" + (e && e.message ? e.message : e));
          }
        }

        run();
      })();
    </script>
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
          // baseUrl gives the page a real http origin so the fetch() to the
          // stream is same-origin and not blocked as mixed content.
          source={{ html: streamHtml(camera.deviceId), baseUrl: STREAM_ORIGIN }}
          // The stream is plain http, so allow it inside the WebView.
          mixedContentMode="always"
          // Lets you inspect the WebView from chrome://inspect while debugging.
          webviewDebuggingEnabled
          scrollEnabled={false}
          pointerEvents="none"
          // The page posts "frame" once frames flow and "error:..." if the
          // stream fails, so the live dot and overlay track the real state.
          onMessage={(event) => {
            const message = event.nativeEvent.data;
            if (message === "frame") {
              setFailed(false);
            } else if (message.startsWith("error")) {
              setFailed(true);
            }
          }}
          onError={() => setFailed(true)}
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
