import { INFERENCE_BASE_URL } from "@/shared/constants/inference";
import { BorderRadius, BrandColors, Spacing, Typography } from "@/shared/theme";
import { useFocusEffect } from "expo-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { LiveCamera } from "../types/live-camera.types";
import { createMjpegDocument } from "../utils/mjpeg-document";

const RETRY_DELAY_MS = 3000;

type StreamStatus = "connecting" | "playing" | "error";

export function LiveCameraView({
  camera,
  label,
  labelIcon,
}: {
  camera: LiveCamera;
  label: string;
  /** Shown before the label, e.g. the phone's lens. */
  labelIcon?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  const active = focused && (appState === "active" || appState === null);
  const streamUrl = `${INFERENCE_BASE_URL}/stream/${encodeURIComponent(camera.deviceId)}/live.mjpeg`;

  // Remount on camera/status changes so old callbacks cannot update a new feed.
  return (
    <CameraStream
      key={`${streamUrl}:${camera.online}:${active}`}
      streamUrl={streamUrl}
      online={camera.online}
      active={active}
      label={label}
      labelIcon={labelIcon}
    />
  );
}

function CameraStream({
  streamUrl,
  online,
  active,
  label,
  labelIcon,
}: {
  streamUrl: string;
  online: boolean;
  active: boolean;
  label: string;
  labelIcon?: ReactNode;
}) {
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  const source = useMemo(
    () => ({ html: createMjpegDocument(streamUrl), baseUrl: streamUrl }),
    [streamUrl],
  );

  const handleMessage = useCallback((message: unknown) => {
    if (message === "mjpeg:playing") setStatus("playing");
    if (message === "mjpeg:error") setStatus("error");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const receive = (event: MessageEvent) => {
      if (iframe.current && event.source === iframe.current.contentWindow) {
        handleMessage(event.data);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [handleMessage]);

  useEffect(() => {
    if (!online || !active || status !== "error") return;
    const timer = setTimeout(() => {
      setAttempt((value) => value + 1);
      setStatus("connecting");
    }, RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [online, active, status]);

  const isPlaying = online && active && status === "playing";
  const showStream = online && active && status !== "error";
  const message = !online
    ? "Camera offline"
    : !active
      ? "Stream paused"
      : status === "error"
        ? "Stream unavailable. Retrying…"
        : status === "connecting"
          ? "Connecting…"
          : null;

  return (
    <View style={styles.container}>
      {showStream ? (
        <View style={StyleSheet.absoluteFill}>
          {Platform.OS === "web" ? (
            <iframe
              key={attempt}
              ref={iframe}
              title={label}
              srcDoc={source.html}
              sandbox="allow-scripts"
              style={{ width: "100%", height: "100%", border: 0 }}
              onError={() => setStatus("error")}
            />
          ) : (
            <WebView
              key={attempt}
              source={source}
              style={styles.webview}
              containerStyle={styles.webview}
              originWhitelist={["*"]}
              javaScriptEnabled
              scrollEnabled={false}
              bounces={false}
              automaticallyAdjustContentInsets={false}
              setBuiltInZoomControls={false}
              cacheEnabled={false}
              cacheMode="LOAD_NO_CACHE"
              // The HTML has the same HTTP origin as the MJPEG endpoint.
              mixedContentMode="never"
              allowFileAccess={false}
              onMessage={(event) => handleMessage(event.nativeEvent.data)}
              onError={() => setStatus("error")}
              onHttpError={() => setStatus("error")}
              onRenderProcessGone={() => setStatus("error")}
              onContentProcessDidTerminate={() => setStatus("error")}
            />
          )}
        </View>
      ) : null}

      {/* Never hide the stream behind an overlay waiting for page onLoadEnd:
          a multipart image response can remain open indefinitely. */}
      {message ? (
        <View pointerEvents="none" style={styles.status}>
          <Text style={styles.statusText}>{message}</Text>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.label}>
        <View
          style={[
            styles.labelDot,
            { backgroundColor: isPlaying ? BrandColors.success : "#9CA3AF" },
          ]}
        />
        {labelIcon}
        <Text style={[Typography.caption, styles.labelText]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fills its parent; the screen sizes the preview frame.
  container: {
    alignSelf: "stretch",
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  status: {
    position: "absolute",
    bottom: Spacing.two,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
  },
  statusText: {
    color: "#FFFFFF",
    ...Typography.medium,
  },
  label: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    gap: Spacing.one + Spacing.half,
    left: Spacing.three,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    position: "absolute",
    top: Spacing.three,
  },
  labelDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  labelText: {
    color: "#FFFFFF",
  },
});
