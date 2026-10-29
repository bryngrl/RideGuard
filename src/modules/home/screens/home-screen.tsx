import MainLogo from "@/assets/icons/logos/main.svg";
import {
  default as ActiveCameraIcon,
  default as InactiveCameraIcon,
} from "@/assets/icons/navigation/active-camera.svg";
import ErrorIcon from "@/assets/icons/status/error.svg";
import { useProfile } from "@/modules/settings/hooks/use-profile";
import { useDeviceStore } from "@/modules/devices";
import { useCameras } from "@/modules/camera-sensor/hooks/use-cameras";
import { useMonitoringStatus } from "@/modules/home/hooks/use-monitoring-status";
import { useRideTimer } from "@/modules/home/hooks/use-ride-timer";
import { ToggleSwitch } from "@/modules/settings/components/toggle-switch";
import { useTheme } from "@/shared/hooks/use-theme";
import { Card } from "@/shared/ui/card";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { RideDetailsSheet } from "@/shared/ui/ride-details-sheet";
import { SweetAlert } from "@/shared/ui/sweet-alert";
import {
  default as ButtonIcon,
  default as InactiveSensorIcon,
} from "@assets/icons/sensors/button/button.svg";

import { Spacing, Typography } from "@/shared/theme";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { LinearTransition, useReducedMotion } from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { QuickActions } from "@/shared/ui/quick-actions";
import {
  CAMERA_CARD_GAP,
  CAMERA_CARD_WIDTH,
  CAMERA_CAROUSEL_END_PADDING,
  styles,
} from "./home-screen.styles";

export function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();
  const reduceMotion = useReducedMotion();

  const { profile, isLoading: isProfileLoading } = useProfile();

  const [isRideActive, setIsRideActive] = useState(false);
  const [showEndRideAlert, setShowEndRideAlert] = useState(false);
  const [showStartCaptureAlert, setShowStartCaptureAlert] = useState(false);
  const [showRideDetailsSheet, setShowRideDetailsSheet] = useState(false);
  const [rideStartedAt, setRideStartedAt] = useState<Date | null>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const carouselEndOffset = Math.max(
    0,
    Spacing.four +
      3 * CAMERA_CARD_WIDTH +
      2 * CAMERA_CARD_GAP +
      CAMERA_CAROUSEL_END_PADDING -
      carouselWidth,
  );

  const { camera1DeviceId, camera2DeviceId, buttonDeviceId } = useDeviceStore();
  const { cameras, isLoading: camerasLoading, error: camerasError } = useCameras();
  const cameraOnline = (id: string | null) => !camerasLoading && !camerasError && cameras.some((camera) => camera.deviceId === id && camera.online);
  const cameraStatus = (id: string | null) => !id ? "Offline" : camerasLoading ? "Checking…" : camerasError ? "Unavailable" : cameraOnline(id) ? "Online" : "Offline";

  const isCamera1Connected = Boolean(camera1DeviceId);
  const isCamera2Connected = Boolean(camera2DeviceId);
  const isButtonConnected = Boolean(buttonDeviceId);
  //!! FOR TESTING ONLY
  // const isCamera1Connected = true;
  // const isCamera2Connected = false;
  // const isButtonConnected = true;

  const displayName = profile.firstName.trim() || "there";

  const hasCameraConnected = isCamera1Connected || isCamera2Connected;
  const activeCameraCount = [cameraOnline(camera1DeviceId), cameraOnline(camera2DeviceId)].filter(
    Boolean,
  ).length;

  const {
    monitoringCardState,
    monitoringCardStyles,
    monitoringTitle,
    monitoringSubtitle,
    monitoringIcon,
  } = useMonitoringStatus({ hasCameraConnected,
    hasOnlineCamera: cameraOnline(camera1DeviceId) || cameraOnline(camera2DeviceId),
    checking: camerasLoading, unavailable: !!camerasError,
  });

  let monitoringAction: (() => void) | undefined;

  if (monitoringCardState === "no-camera") {
    const slot = isCamera1Connected || !isCamera2Connected ? 1 : 2;
    monitoringAction = () => router.push(`/(onboarding)/devices/camera?camera=${slot}&source=settings` as any);
  }

  const handleStartRide = () => {
    setRideStartedAt(new Date());
    setIsRideActive(true);
  };

  const handleStartCapture = () => {
    if (!isCamera1Connected) return;

    if (isCamera2Connected && isButtonConnected) {
      handleStartRide();
      return;
    }

    setShowStartCaptureAlert(true);
  };

  const handleStartAnyway = () => {
    setShowStartCaptureAlert(false);
    handleStartRide();
  };

  const handleConnectDevices = () => {
    setShowStartCaptureAlert(false);
    router.push("/devices" as any);
  };

  const startCaptureAlert =
    !isCamera2Connected && !isButtonConnected
      ? {
          title: "Start capturing with limited setup?",
          description:
            "Camera 2 and your Quick Button aren't connected. You'll only have single-camera coverage this ride.",
        }
      : !isCamera2Connected
        ? {
            title: "Start capturing with one camera?",
            description:
              "Camera 2 isn't connected. Coverage will be limited to a single angle this ride.",
          }
        : {
            title: "Start capturing without the Quick Button?",
            description:
              "Your Quick Button isn't connected. Use the app for SOS, ending the ride, or reporting a false alarm.",
          };

  const handleEndRide = () => {
    setShowEndRideAlert(true);
  };

  const handleConfirmEndRide = () => {
    setIsRideActive(false);
    setRideStartedAt(null);
    setShowEndRideAlert(false);
    setTimeout(() => {
      setShowRideDetailsSheet(true);
    }, 250);
  };

  const handleCloseRideDetails = () => {
    setShowRideDetailsSheet(false);
  };

  const handleKeepMonitoring = () => {
    setShowEndRideAlert(false);
  };

  const { formattedDuration } = useRideTimer(isRideActive, rideStartedAt);

  const cameraCoverageColor =
    activeCameraCount === 0
      ? colors.error
      : activeCameraCount === 1
        ? colors.warningHeader
        : colors.success;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        safeAreaEdges={["top"]}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <MainLogo color={colors.logo} width={32} height={42} />
            <Text style={[styles.brandName, { color: colors.primary }]}>
              ideguard
            </Text>
          </View>

          {/* GREETING */}
          <View style={styles.greeting}>
            <Text
              style={[
                Typography.body,
                styles.greetingHello,
                { color: colors.text },
              ]}
            >
              Hello,
            </Text>

            <Text
              style={[
                Typography.h4,
                styles.greetingName,
                { color: colors.text },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {isProfileLoading ? " " : `${displayName}!`}
            </Text>
          </View>
        </View>

        {/* RIDE STATUS */}
        <View style={styles.statusSectionWrapper}>
          <Svg
            style={styles.statusGradient}
            width="100%"
            height={150}
            viewBox="0 0 400 150"
            preserveAspectRatio="none"
            pointerEvents="none"
          >
            <Defs>
              <SvgLinearGradient id="homeHeaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.homeGradientStart} />
                <Stop offset="45%" stopColor={colors.homeGradientMiddle} />
                <Stop offset="100%" stopColor={colors.homeGradientEnd} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M0 0 H400 V128 Q200 172 0 128 Z"
              fill="url(#homeHeaderGradient)"
            />
          </Svg>

          <Animated.View
            layout={reduceMotion ? undefined : LinearTransition.duration(220)}
            style={styles.statusSection}
          >
            {monitoringCardState === "no-camera" && (
              <LinearGradient
                colors={[colors.warningGradientStart, colors.warningGradientMiddle, colors.warningGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.monitoringCardGradient}
                pointerEvents="none"
              />
            )}
            <Animated.View
              layout={reduceMotion ? undefined : LinearTransition.duration(220)}
            >
              <Card
                size="large"
                title={monitoringTitle}
                subtitle={monitoringSubtitle}
                icon={monitoringIcon}
                style={styles.monitoringCard}
                titleStyle={styles.monitoringStateTitle}
                subtitleStyle={styles.monitoringStateSubtitle}
                backgroundColor={
                  monitoringCardState === "no-camera"
                    ? "transparent"
                    : monitoringCardStyles.backgroundColor
                }
                borderColor={monitoringCardStyles.borderColor}
                titleColor={monitoringCardStyles.titleColor}
                subtitleColor={monitoringCardStyles.subtitleColor}
                actionTitle={
                  monitoringAction ? "Connect" : undefined
                }
                onActionPress={monitoringAction}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* DEVICE CARDS */}
        <View style={styles.deviceCards}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}
            scrollEnabled={carouselEndOffset > 0}
            snapToOffsets={[0, carouselEndOffset]}
            decelerationRate="fast"
            contentContainerStyle={styles.deviceCardsScrollContent}
          >
            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                spacious
                style={styles.deviceCard}
                title="Camera 1"
                subtitle={camera1DeviceId || "Not paired"}
                status={cameraStatus(camera1DeviceId)}
                connectionState={
                  cameraOnline(camera1DeviceId) ? "connected" : "disconnected"
                }
                icon={
                  isCamera1Connected ? (
                    <ActiveCameraIcon color={colors.icon} width={14} height={14} />
                  ) : (
                    <InactiveCameraIcon color={colors.textInactive} width={14} height={14} />
                  )
                }
                onPress={() => router.push("/devices?focus=camera1" as any)}
              />
            </View>

            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                spacious
                style={styles.deviceCard}
                title="Camera 2"
                subtitle={camera2DeviceId || "Not paired"}
                status={cameraStatus(camera2DeviceId)}
                connectionState={
                  cameraOnline(camera2DeviceId) ? "connected" : "disconnected"
                }
                icon={
                  isCamera2Connected ? (
                    <ActiveCameraIcon color={colors.icon} width={14} height={14} />
                  ) : (
                    <InactiveCameraIcon color={colors.textInactive} width={14} height={14} />
                  )
                }
                onPress={() => router.push("/devices?focus=camera2" as any)}
              />
            </View>

            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                spacious
                style={styles.deviceCard}
                title="Button"
                subtitle={buttonDeviceId || "Not paired"}
                status={isButtonConnected ? "Paired" : "Not paired"}
                connectionState={
                  isButtonConnected ? "connected" : "disconnected"
                }
                icon={
                  isButtonConnected ? (
                    <ButtonIcon color={colors.icon} width={18} height={18} />
                  ) : (
                    <InactiveSensorIcon color={colors.textInactive} width={18} height={18} />
                  )
                }
                onPress={() => router.push("/devices?focus=button" as any)}
              />
            </View>
          </ScrollView>
        </View>

        {/* OVERVIEW */}
        <View style={styles.todaySection}>
          <Text style={[Typography.h3, { color: colors.primary }]}>
            Overview
          </Text>

          <View style={styles.currentRideContainer}>
            {/* Capturing Status */}
            <View style={styles.currentRideRow}>
              <Text
                style={[
                  Typography.body,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Capturing status
              </Text>

              <ToggleSwitch
                value={isRideActive}
                onChange={(enabled) =>
                  enabled ? handleStartCapture() : handleEndRide()
                }
                disabled={
                  (!isCamera1Connected && !isRideActive) ||
                  showStartCaptureAlert ||
                  showEndRideAlert
                }
                size="regular"
                accessibilityLabel="Capturing status"
              />
            </View>

            {!isCamera1Connected && !isRideActive && (
              <View style={styles.cameraWarning}>
                <ErrorIcon color={colors.error} width={16} height={16} />
                <Text style={[styles.cameraWarningText, { color: colors.dangerHeader }]}>
                  {hasCameraConnected
                    ? "Connect Camera 1 to enable monitoring"
                    : "Connect at least 1 camera to enable monitoring"}
                </Text>
              </View>
            )}

            {/* Duration */}
            <View style={styles.currentRideRow}>
              <Text
                style={[
                  Typography.body,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Duration
              </Text>

              <Text
                style={[
                  Typography.body,
                  styles.currentRideValue,
                  { color: colors.textMuted },
                ]}
              >
                {formattedDuration}
              </Text>
            </View>

            {/* Camera Coverage */}
            <View style={styles.currentRideRow}>
              <Text
                style={[
                  Typography.body,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Camera in use
              </Text>

              <Text
                style={[
                  Typography.body,
                  styles.currentRideValue,
                  {
                    color: cameraCoverageColor,
                  },
                ]}
              >
                {camerasLoading ? "Checking…" : camerasError ? "Unavailable" : `${activeCameraCount} of 2 active`}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingWrapper>

      <QuickActions homeLayout />

      <SweetAlert
        visible={showStartCaptureAlert}
        type="warning"
        showIcon={false}
        title={startCaptureAlert.title}
        description={startCaptureAlert.description}
        secondaryButtonText="Start anyway"
        secondaryButtonVariant="secondary"
        primaryButtonText="Connect"
        primaryButtonVariant="primary"
        buttonBorderRadius={9999}
        onSecondaryPress={handleStartAnyway}
        onPrimaryPress={handleConnectDevices}
        onClose={() => setShowStartCaptureAlert(false)}
      />

      <SweetAlert
        visible={showEndRideAlert}
        type="warning"
        showIcon={false}
        title="End this ride?"
        description="Safety monitoring will stop, and ride details will be saved to your history."
        primaryButtonText="End Ride"
        primaryButtonVariant="primary"
        secondaryButtonText="Keep Monitoring"
        secondaryButtonVariant="secondary"
        buttonBorderRadius={9999}
        onPrimaryPress={handleConfirmEndRide}
        onSecondaryPress={handleKeepMonitoring}
        onClose={handleKeepMonitoring}
      />

      <RideDetailsSheet
        visible={showRideDetailsSheet}
        onClose={handleCloseRideDetails}
      />

    </View>
  );
}
