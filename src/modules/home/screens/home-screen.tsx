import MainLogo from "@/assets/icons//logos/main.svg";
import SosIcon from "@/assets/icons/home/echo-sos.svg";
import ContactIcon from "@/assets/icons/home/filled-contact.svg";
import InactiveRideIcon from "@/assets/icons/home/ride-inactive.svg";
import SecurityIcon from "@/assets/icons/home/security.svg";
import SilentNotificationIcon from "@/assets/icons/home/sheet-icon.svg";
import ActiveCameraIcon from "@/assets/icons/navigation/active-camera.svg";
import InactiveCameraIcon from "@/assets/icons/navigation/inactive-camera.svg";
import InactiveSensorIcon from "@/assets/icons/sensors/metal/inactive.svg";
import ActiveSensorIcon from "@/assets/icons/sensors/metal/metal.svg";
import SystemReadyIcon from "@/assets/icons/status/success.svg";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useOnboardingStore } from "@/modules/onboarding";
import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { RideDetailsSheet } from "@/shared/ui/ride-details-sheet";
import { SweetAlert } from "@/shared/ui/sweet-alert";
import { useDeviceStore } from "@/modules/devices";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./home-screen.styles";

export function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();

  const firstName = useOnboardingStore((state) => state.firstName);
  const cameraDeviceId = useDeviceStore((state) => state.cameraDeviceId);

  const [isRideActive, setIsRideActive] = useState(false);
  const [showEndRideAlert, setShowEndRideAlert] = useState(false);
  const [showRideDetailsSheet, setShowRideDetailsSheet] = useState(false);

  // Temporary frontend states
  const isCameraConnected = true;
  const isMetalSensorConnected = true;

  const displayName = firstName.trim() || "Jovilyn";
  const areAllSafetySystemsActive = isCameraConnected && isMetalSensorConnected;

  const systemStatusText = areAllSafetySystemsActive
    ? "All safety systems active."
    : !isCameraConnected && !isMetalSensorConnected
      ? "Safety systems are not connected."
      : !isCameraConnected
        ? "Camera is not connected."
        : "Metal sensor is not connected.";

  const systemStatusIconBackground = areAllSafetySystemsActive
    ? "#E6F8E7"
    : colors.backgroundSelected;

  const systemStatusTextColor = areAllSafetySystemsActive
    ? colors.textMuted
    : colors.textInactive;

  const handleStartRide = () => {
    setIsRideActive(true);
  };

  const handleEndRide = () => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper
        enableScrollView={true}
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
              title={isRideActive ? "System Ready" : "No active ride"}
              subtitle={
                isRideActive
                  ? "Waiting for passenger to board."
                  : "Start a ride to begin system monitoring."
              }
              icon={
                isRideActive ? (
                  <SystemReadyIcon width={38} height={38} />
                ) : (
                  <InactiveRideIcon width={38} height={38} />
                )
              }
            />
          </View>
        </View>

        {/* DEVICE CARDS */}
        <View style={styles.deviceCards}>
          <Card
            size="small"
            title="Camera"
            subtitle={cameraDeviceId || "Hardware name"}
            status={isCameraConnected ? "Connected" : "Not connected"}
            connectionState={isCameraConnected ? "connected" : "disconnected"}
            icon={
              isCameraConnected ? (
                <ActiveCameraIcon width={18} height={18} />
              ) : (
                <InactiveCameraIcon width={18} height={18} />
              )
            }
          />

          <Card
            size="small"
            title="Metal sensor"
            subtitle="Hardware name"
            status={isMetalSensorConnected ? "Connected" : "Not connected"}
            connectionState={
              isMetalSensorConnected ? "connected" : "disconnected"
            }
            icon={
              isMetalSensorConnected ? (
                <ActiveSensorIcon width={18} height={18} />
              ) : (
                <InactiveSensorIcon width={18} height={18} />
              )
            }
          />
        </View>

        {/* START RIDE */}
        {!isRideActive && (
          <Button
            title="Start Ride"
            variant="primary"
            size="md"
            fullWidth
            onPress={handleStartRide}
            style={styles.rideButton}
          />
        )}

        {/* SYSTEM STATUS */}
        {isRideActive ? (
          <View
            style={[
              styles.silentNotificationCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: "#C9D6EA",
              },
            ]}
          >
            <View style={styles.silentNotificationIcon}>
              <SilentNotificationIcon width={20} height={20} />
            </View>

            <View style={styles.silentNotificationTextContainer}>
              <Text
                style={[
                  Typography.caption,
                  styles.silentNotificationTitle,
                  { color: colors.text },
                ]}
              >
                Silent notifications active
              </Text>

              <Text
                style={[
                  Typography.caption,
                  styles.silentNotificationDescription,
                  { color: colors.textMuted },
                ]}
              >
                Alerts will be displayed without sound.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.systemStatus}>
            <View
              style={[
                styles.systemStatusIcon,
                { backgroundColor: systemStatusIconBackground },
              ]}
            >
              <SecurityIcon width={16} height={16} />
            </View>

            <Text
              style={[
                Typography.bodySmall,
                styles.systemStatusText,
                { color: systemStatusTextColor },
              ]}
            >
              {systemStatusText}
            </Text>
          </View>
        )}

        {/* RIDE INFORMATION */}
        <View style={styles.todaySection}>
          <Text
            style={[
              Typography.h4,
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            {isRideActive ? "Current ride" : "Today's rides"}
          </Text>

          {isRideActive ? (
            <View style={styles.currentRideContainer}>
              <View style={styles.currentRideRow}>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  Passenger boarded
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideValue,
                    { color: colors.text },
                  ]}
                >
                  Waiting for passenger
                </Text>
              </View>

              <View style={styles.currentRideRow}>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  Metal detection
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideValue,
                    { color: colors.text },
                  ]}
                >
                  Standby
                </Text>
              </View>

              <View style={styles.currentRideRow}>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  Camera monitoring
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    styles.currentRideValue,
                    { color: colors.text },
                  ]}
                >
                  Active
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyRides}>
              <InactiveRideIcon width={72} height={72} />
              <Text
                style={[
                  Typography.bodySmall,
                  { color: colors.textInactive },
                ]}
              >
                No rides taken today
              </Text>
            </View>
          )}
        </View>

        {/* END RIDE */}
        {isRideActive && (
          <Button
            title="End Ride"
            variant="danger"
            size="md"
            fullWidth
            onPress={handleEndRide}
            style={styles.endRideButton}
          />
        )}
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
