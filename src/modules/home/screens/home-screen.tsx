import MainLogo from "@/assets/icons//logos/main.svg";
import SosIcon from "@/assets/icons/home/echo-sos.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import {
  default as ActiveCameraIcon,
  default as InactiveCameraIcon,
} from "@/assets/icons/navigation/active-camera.svg";
import ErrorIcon from "@/assets/icons/status/error.svg";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useDeviceStore } from "@/modules/devices";
import { useMonitoringStatus } from "@/modules/home/hooks/use-monitoring-status";
import { useRideTimer } from "@/modules/home/hooks/use-ride-timer";
import { useOnboardingStore } from "@/modules/onboarding";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { RideDetailsSheet } from "@/shared/ui/ride-details-sheet";
import { SweetAlert } from "@/shared/ui/sweet-alert";
import {
  default as ButtonIcon,
  default as InactiveSensorIcon,
} from "@assets/icons/sensors/button/button.svg";

import { Typography } from "@/shared/theme";
import { BrandColors, Colors } from "@/shared/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "./home-screen.styles";
export function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();

  const firstName = useOnboardingStore((state) => state.firstName);

  const [isRideActive, setIsRideActive] = useState(false);
  const [showEndRideAlert, setShowEndRideAlert] = useState(false);
  const [showRideDetailsSheet, setShowRideDetailsSheet] = useState(false);
  const [rideStartedAt, setRideStartedAt] = useState<Date | null>(null);

  const { camera1DeviceId, camera2DeviceId, buttonDeviceId } = useDeviceStore();

  const isCamera1Connected = Boolean(camera1DeviceId);
  const isCamera2Connected = Boolean(camera2DeviceId);
  const isButtonConnected = Boolean(buttonDeviceId);
  //!! FOR TESTING ONLY
  // const isCamera1Connected = false;
  // const isCamera2Connected = false;
  // const isButtonConnected = true;

  const displayName = firstName.trim() || "Jovilyn";

  const hasCameraConnected = isCamera1Connected || isCamera2Connected;

  const {
    monitoringCardState,
    monitoringCardStyles,
    monitoringTitle,
    monitoringSubtitle,
    monitoringIcon,
  } = useMonitoringStatus({ hasCameraConnected });

  let monitoringAction: (() => void) | undefined;

  if (monitoringCardState === "no-camera") {
    monitoringAction = () => router.push("/(onboarding)/devices/camera" as any);
  }

  const handleStartRide = () => {
    setRideStartedAt(new Date());
    setIsRideActive(true);
  };

  const handleEndRide = () => {
    setRideStartedAt(null);
    setShowEndRideAlert(true);
  };

  const handleConfirmEndRide = () => {
    setIsRideActive(false);
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

  const activeCameraCount = [isCamera1Connected, isCamera2Connected].filter(
    Boolean,
  ).length;

  const { formattedDuration } = useRideTimer(isRideActive, rideStartedAt);

  const cameraCoverageColor =
    activeCameraCount === 0
      ? BrandColors.error
      : activeCameraCount === 1
        ? Colors.light.warningHeader
        : "#2CB031";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        enableScrollView={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <MainLogo width={30} height={40} />
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
            >
              {displayName}!
            </Text>
          </View>
        </View>

        {/* RIDE STATUS */}
        <View style={styles.statusSectionWrapper}>
          <LinearGradient
            colors={["#FFFFFF", "#F5F8FF", "#DCE8FF"]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.statusGradient}
            pointerEvents="none"
          />

          <View style={styles.statusSection}>
            <Card
              size="large"
              title={monitoringTitle}
              subtitle={monitoringSubtitle}
              icon={monitoringIcon}
              backgroundColor={monitoringCardStyles.backgroundColor}
              borderColor={monitoringCardStyles.borderColor}
              titleColor={monitoringCardStyles.titleColor}
              subtitleColor={monitoringCardStyles.subtitleColor}
              actionTitle={
                monitoringCardState === "no-camera" ? "Connect" : undefined
              }
              onActionPress={monitoringAction}
            />
          </View>
        </View>

        {/* DEVICE CARDS */}
        <View style={styles.deviceCards}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deviceCardsScrollContent}
          >
            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                title="Camera 1"
                subtitle={camera1DeviceId || "Hardware name"}
                status={isCamera1Connected ? "Connected" : "Not connected"}
                connectionState={
                  isCamera1Connected ? "connected" : "disconnected"
                }
                icon={
                  isCamera1Connected ? (
                    <ActiveCameraIcon width={14} height={14} />
                  ) : (
                    <InactiveCameraIcon width={14} height={14} />
                  )
                }
                onPress={() => router.push("/devices" as any)}
              />
            </View>

            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                title="Camera 2"
                subtitle={camera2DeviceId || "Hardware name"}
                status={isCamera2Connected ? "Connected" : "Not connected"}
                connectionState={
                  isCamera2Connected ? "connected" : "disconnected"
                }
                icon={
                  isCamera2Connected ? (
                    <ActiveCameraIcon width={14} height={14} />
                  ) : (
                    <InactiveCameraIcon width={14} height={14} />
                  )
                }
                onPress={() => router.push("/devices" as any)}
              />
            </View>

            <View style={styles.deviceCardItem}>
              <Card
                size="small"
                title="Button"
                subtitle={buttonDeviceId || "Hardware name"}
                status={isButtonConnected ? "Connected" : "Not connected"}
                connectionState={
                  isButtonConnected ? "connected" : "disconnected"
                }
                icon={
                  isButtonConnected ? (
                    <ButtonIcon width={18} height={18} />
                  ) : (
                    <InactiveSensorIcon width={18} height={18} />
                  )
                }
                onPress={() => router.push("/devices" as any)}
              />
            </View>
          </ScrollView>
        </View>

        {/* OVERVIEW */}
        <View style={styles.todaySection}>
          <Text style={[Typography.h2, { color: colors.primary }]}>
            Overview
          </Text>

          <View style={styles.currentRideContainer}>
            {/* Capturing Status */}
            <View style={styles.currentRideRow}>
              <Text
                style={[
                  Typography.caption,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Capturing status
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isRideActive ? "#E5FFE6" : "#7b7b7b20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isRideActive ? "#2CB031" : "#7B7B7B",
                    },
                  ]}
                >
                  {isRideActive ? "On" : "Off"}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.currentRideRow}>
              <Text
                style={[
                  Typography.caption,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Duration
              </Text>

              <Text
                style={[
                  Typography.caption,
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
                  Typography.caption,
                  styles.currentRideLabel,
                  { color: colors.text },
                ]}
              >
                Camera coverage
              </Text>

              <Text
                style={[
                  Typography.caption,
                  styles.currentRideValue,
                  {
                    color: cameraCoverageColor,
                  },
                ]}
              >
                {activeCameraCount} of 2 active
              </Text>
            </View>
          </View>
          {/* CAPTURING BUTTON */}
          <Button
            title={isRideActive ? "Stop Capturing" : "Start Capturing"}
            variant={isRideActive ? "danger" : "primary"}
            size="md"
            fullWidth
            disabled={!hasCameraConnected}
            onPress={isRideActive ? handleEndRide : handleStartRide}
            style={isRideActive ? styles.endRideButton : styles.rideButton}
          />
          {!hasCameraConnected && (
            <View style={styles.cameraWarning}>
              <ErrorIcon width={16} height={16} />

              <Text style={styles.cameraWarningText}>
                Connect at least 1 camera to enable monitoring
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingWrapper>

      {/* QUICK ACTIONS */}
      <View
        style={[
          styles.quickActionsContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.actionPressed,
            ]}
            onPress={() => router.push("/sos" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open SOS emergency screen"
          >
            <SosIcon width={15} height={15} />
            <Text style={[Typography.caption, styles.sosButtonText]}>SOS</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.contactsButton,
              { borderColor: colors.primary },
              pressed && styles.actionPressed,
            ]}
            onPress={() => router.push("/contact" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open emergency contacts"
          >
            <ContactIcon width={13} height={16} />
            <Text style={[Typography.caption, { color: colors.primary }]}>
              Contacts
            </Text>
          </Pressable>
        </View>
      </View>

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

      <BottomNavigation />
    </View>
  );
}
