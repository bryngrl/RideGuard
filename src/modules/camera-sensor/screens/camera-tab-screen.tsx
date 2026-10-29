import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  formatRemaining,
  isPhoneActive,
  type PhoneCapture,
  PhoneCapturePanel,
  usePhoneCapture,
} from "@/modules/phone-camera";
import { PHONE_CAPTURE_ENABLED } from "@/shared/constants/phone-capture";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, DeviceCardLayout, Spacing, Typography } from "@/shared/theme";
import { Card } from "@/shared/ui/card";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { QuickActions } from "@/shared/ui/quick-actions";

import CameraIcon from "@/assets/icons/navigation/active-camera.svg";

import { CameraPreviewFrame, CameraPreviewPlaceholder as Placeholder, HardwareCameraPreview } from "../components/camera-preview-frame";
import { LiveCameraView } from "../components/live-camera-view";
import { useCameras } from "../hooks/use-cameras";
import type { PhoneCaptureLens } from "../../../../modules/phone-capture";
import type { LiveCamera } from "../types/live-camera.types";

/** The device store has slots for two ESP32 cameras. */
const MAX_EXTERNAL_CAMERAS = 2;
const PHONE_KEY = "phone";
const ADD_KEY = "add";
/** Height of the phone controls row: a `Button size="md"`. */
const CONTROLS_HEIGHT = 40;

type External = { camera: LiveCamera; label: string };

// The phone hook registers this install as a camera, so only mount it when
// phone capture can run.
const SHOW_PHONE = PHONE_CAPTURE_ENABLED && Platform.OS === "android";

export function CameraTabScreen() {
  return SHOW_PHONE ? <WithPhone /> : <CameraPreview phone={null} />;
}

function WithPhone() {
  return <CameraPreview phone={usePhoneCapture()} />;
}

function CameraPreview({ phone }: { phone: PhoneCapture | null }) {
  const colors = useTheme();
  const router = useRouter();
  const { cameras, isLoading, error } = useCameras();
  // Phone cameras come from the phone hook, not the hardware list.
  const externals: External[] = cameras
    .filter((camera) => camera.source !== "phone")
    .map((camera, index) => ({ camera, label: `Camera ${index + 1}` }));
  const canAdd = !isLoading && !error && externals.length < MAX_EXTERNAL_CAMERAS;

  const phoneLive = phone !== null && isPhoneActive(phone);
  const liveCount =
    externals.filter(({ camera }) => camera.online).length + (phoneLive ? 1 : 0);
  const totalCount = externals.length + (phone ? 1 : 0);

  const [picked, setPicked] = useState<string | null>(null);
  const keys = [
    ...(phone ? [PHONE_KEY] : []),
    ...externals.map(({ camera }) => camera.deviceId),
    ...(canAdd ? [ADD_KEY] : []),
  ];
  const selected =
    picked && keys.includes(picked)
      ? picked
      : (externals.find(({ camera }) => camera.online)?.camera.deviceId ??
        keys[0] ??
        null);
  const selectedExternal = externals.find(
    ({ camera }) => camera.deviceId === selected,
  );

  const addCamera = () =>
    router.push(
      `/(onboarding)/devices/camera?camera=${externals.length + 1}&source=settings` as never,
    );

  let preview: ReactNode;
  if (isLoading) {
    preview = <ActivityIndicator color={colors.text} />;
  } else if (error && !phone) {
    preview = <Placeholder icon="alert-circle-outline" title={error} />;
  } else if (selected === PHONE_KEY && phone) {
    preview = !phone.supported ? (
      <Placeholder
        icon="camera-outline"
        title="Phone camera unavailable"
        body="Install the latest app build to use your phone as a camera."
      />
    ) : phoneLive && phone.deviceId ? (
      // The server's view of this phone. It can close while capture keeps
      // running in the background.
      <LiveCameraView
        camera={{
          deviceId: phone.deviceId,
          streamUrl: null,
          online: phone.status?.connected === true,
          lastSeenAt: null,
          source: "phone",
        }}
        label={lensLabel(phone.lens)}
        labelIcon={<LensIcon lens={phone.lens} />}
      />
    ) : (
      <Placeholder
        icon="camera-outline"
        title="Phone camera is off"
        body="Tap Start camera below to see the preview."
      />
    );
  } else if (selectedExternal) {
    preview = <HardwareCameraPreview camera={selectedExternal.camera} label={selectedExternal.label} error={error}
      onConnect={() => router.push(`/(onboarding)/devices/camera?camera=${externals.indexOf(selectedExternal) + 1}&source=settings` as never)} />;
  } else if (selected === ADD_KEY) {
    preview = (
      <Placeholder
        icon="add"
        iconColor={colors.accent}
        onIconPress={addCamera}
        title={externals.length === 0 ? "Add a camera" : "Add another camera"}
        body="Add an external camera, like an ESP32-CAM, to preview it here."
      />
    );
  } else {
    preview = (
      <Placeholder icon="videocam-outline" title="No cameras linked yet" />
    );
  }

  const isAddPreview = !isLoading && selected === ADD_KEY;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        enableScrollView={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[Typography.largeTitle, { color: colors.text }]}>
            Camera preview
          </Text>
          {totalCount > 0 ? (
            <View style={styles.row}>
              <Dot
                color={liveCount > 0 ? colors.success : colors.textInactive}
              />
              <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
                {liveCount} of {totalCount}{" "}
                {totalCount === 1 ? "camera" : "cameras"} live
              </Text>
            </View>
          ) : null}
        </View>

        <CameraPreviewFrame dashed={isAddPreview}>
          {preview}
          {selected === PHONE_KEY && phone?.supported && !phoneLive ? (
            <View pointerEvents="none" style={[styles.overlayPill, styles.left]}>
              <LensIcon lens={phone.lens} />
              <Text style={[Typography.caption, styles.overlayText]}>
                {lensLabel(phone.lens)}
              </Text>
            </View>
          ) : null}
          {selected === PHONE_KEY && phone?.status?.active ? (
            <View pointerEvents="none" style={[styles.overlayPill, styles.right]}>
              <Text style={[Typography.caption, styles.overlayText]}>
                {formatRemaining(phone.remainingMs)} left ·{" "}
                {phone.status.framesSent} sent
              </Text>
            </View>
          ) : null}
        </CameraPreviewFrame>

        {keys.length > 0 ? (
          <View style={styles.sources}>
            <View style={[styles.row, styles.between]}>
              <Text style={[Typography.label, { color: colors.textMuted }]}>
                SOURCES
              </Text>
              <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
                {canAdd
                  ? `${externals.length} of ${MAX_EXTERNAL_CAMERAS} external`
                  : "Tap to show"}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiles}
            >
              {phone ? (
                <SourceTile
                  title="Phone"
                  subtitle="This phone"
                  status={
                    phoneLive
                      ? `${phone.lens === "front" ? "Front" : "Back"} camera · live`
                      : `Off · ${phone.lens === "front" ? "Front" : "Back"} camera`
                  }
                  live={phoneLive}
                  icon={
                    <Ionicons
                      name="phone-portrait-outline"
                      size={14}
                      color={colors.text}
                    />
                  }
                  selected={selected === PHONE_KEY}
                  onPress={() => setPicked(PHONE_KEY)}
                />
              ) : null}
              {externals.map(({ camera, label }) => (
                <SourceTile
                  key={camera.deviceId}
                  title={label}
                  subtitle={camera.deviceId}
                  status={error ? "Unavailable" : camera.online ? "Online" : "Offline"}
                  live={!error && camera.online}
                  icon={<CameraIcon color={colors.icon} width={14} height={14} />}
                  selected={selected === camera.deviceId}
                  onPress={() => setPicked(camera.deviceId)}
                />
              ))}
              {canAdd ? (
                <View style={styles.tile}>
                  <Card
                    size="small"
                    spacious
                    title="Add camera"
                    subtitle={`${MAX_EXTERNAL_CAMERAS - externals.length} left`}
                    titleColor={colors.accent}
                    borderColor={colors.accent}
                    backgroundColor={
                      selected === ADD_KEY ? colors.backgroundSelected : undefined
                    }
                    icon={<Ionicons name="add" size={16} color={colors.accent} />}
                    onPress={() =>
                      selected === ADD_KEY ? addCamera() : setPicked(ADD_KEY)
                    }
                    style={styles.addTile}
                  />
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}

        {/* Every source keeps the phone controls' space so the preview frame
            stays the same size when switching. */}
        {phone ? (
          <View style={styles.footer}>
            {selected === PHONE_KEY && phone.supported ? (
              <PhoneCapturePanel capture={phone} />
            ) : null}
          </View>
        ) : null}
      </KeyboardAvoidingWrapper>

      <QuickActions homeLayout />
    </View>
  );
}

/** The home screen device card, with a selected state. */
function SourceTile({
  title,
  subtitle,
  status,
  live,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  status: string;
  live: boolean;
  icon: ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <View style={styles.tile}>
      <Card
        size="small"
        spacious
        style={styles.sourceCard}
        title={title}
        subtitle={subtitle}
        status={status}
        connectionState={live ? "connected" : "disconnected"}
        icon={icon}
        borderColor={selected ? colors.accent : undefined}
        backgroundColor={selected ? colors.backgroundSelected : undefined}
        onPress={onPress}
      />
    </View>
  );
}

function lensLabel(lens: PhoneCaptureLens): string {
  return lens === "front" ? "Front camera" : "Back camera";
}

/** Front faces the rider; back faces the road. */
function LensIcon({ lens }: { lens: PhoneCaptureLens }) {
  return (
    <Ionicons
      name={lens === "front" ? "person-outline" : "camera-outline"}
      size={14}
      color="#FFFFFF"
    />
  );
}

function Dot({ color }: { color: string }) {
  return (
    <View
      style={{
        backgroundColor: color,
        borderRadius: 4,
        height: 8,
        width: 8,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one + Spacing.half,
  },
  between: {
    justifyContent: "space-between",
  },
  center: {
    textAlign: "center",
  },
  // Takes the height left after the other sections so nothing scrolls.
  preview: {
    alignItems: "center",
    flex: 1,
    minHeight: 160,
    borderRadius: BorderRadius.xl + Spacing.one,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  // Mirrors the camera label pill in LiveCameraView.
  overlayPill: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    position: "absolute",
    top: Spacing.three,
  },
  left: {
    left: Spacing.three,
  },
  right: {
    right: Spacing.three,
  },
  overlayText: {
    color: "#FFFFFF",
  },
  placeholder: {
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconTileLarge: {
    height: 64,
    marginBottom: Spacing.two,
    width: 64,
  },
  sources: {
    gap: Spacing.two,
  },
  footer: {
    minHeight: CONTROLS_HEIGHT,
  },
  // Same row as the home screen device cards.
  tiles: {
    gap: DeviceCardLayout.gap,
  },
  tile: {
    width: DeviceCardLayout.width,
  },
  sourceCard: { minHeight: DeviceCardLayout.minHeight },
  addTile: {
    borderStyle: "dashed",
    minHeight: DeviceCardLayout.minHeight,
  },
});
