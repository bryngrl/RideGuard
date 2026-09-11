import SosIcon from "@/assets/icons/home-icons/echo-sos-icon.svg";
import ContactIcon from "@/assets/icons/home-icons/filled-contact-icon.svg";
import InactiveRideIcon from "@/assets/icons/home-icons/inactive-ride-icon.svg";
import SecurityIcon from "@/assets/icons/home-icons/security-icon.svg";
import MainLogo from "@/assets/icons/main-logo.svg";

import InactiveSensorIcon from "@/assets/icons/metal-sensor/inactive-metal-sensor.svg";
import ActiveSensorIcon from "@/assets/icons/metal-sensor/metal-icon.svg";

import SystemReadyIcon from "@/assets/icons/modal-icon/success-icon.svg";

import ActiveCameraIcon from "@/assets/icons/navigation-icons/active-camera.svg";
import InactiveCameraIcon from "@/assets/icons/navigation-icons/inactive-camera.svg";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";

import {
  BorderRadius,
  BrandColors,
  FontFamily,
  Spacing,
  Typography,
} from "@/constants/theme";

import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useDeviceStore } from "@/store/useDeviceStore";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();

  const firstName = useAuthStore((state) => state.firstName);

  const cameraDeviceId = useDeviceStore((state) => state.cameraDeviceId);

  const metalDeviceId = useDeviceStore((state) => state.metalDeviceId);

  const [isRideActive, setIsRideActive] = useState(false);

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

  const handleRidePress = () => {
    setIsRideActive((currentState) => !currentState);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <KeyboardAvoidingWrapper
        enableScrollView={true}
        contentContainerStyle={styles.content}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <MainLogo width={30} height={40} />

            <Text
              style={[
                styles.brandName,
                {
                  color: colors.primary,
                },
              ]}
            >
              ideguard
            </Text>
          </View>

          {/* GREETING */}
          <View style={styles.greeting}>
            <Text
              style={[
                Typography.body,
                styles.greetingHello,
                {
                  color: colors.text,
                },
              ]}
            >
              Hello,
            </Text>

            <Text
              style={[
                Typography.h4,
                styles.greetingName,
                {
                  color: colors.text,
                },
              ]}
            >
              {displayName}!
            </Text>
          </View>
        </View>

        {/* ================= RIDE STATUS ================= */}
        <View style={styles.statusSectionWrapper}>
          {/* BACKGROUND GRADIENT */}
          <LinearGradient
            colors={["#FFFFFF", "#F5F8FF", "#DCE8FF"]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.statusGradient}
            pointerEvents="none"
          />

          {/* LARGE CARD */}
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

        {/* ================= DEVICE CARDS ================= */}
        <View style={styles.deviceCards}>
          {/* CAMERA */}
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

          {/* METAL SENSOR */}
          <Card
            size="small"
            title="Metal sensor"
            subtitle={metalDeviceId || "Hardware name"}
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

        {/* ================= START / END RIDE ================= */}
        <Button
          title={isRideActive ? "End Ride" : "Start Ride"}
          variant="primary"
          size="md"
          fullWidth
          onPress={handleRidePress}
          style={styles.rideButton}
        />

        {/* ================= SYSTEM STATUS ================= */}
        <View style={styles.systemStatus}>
          <View
            style={[
              styles.systemStatusIcon,
              {
                backgroundColor: systemStatusIconBackground,
              },
            ]}
          >
            <SecurityIcon width={16} height={16} />
          </View>

          <Text
            style={[
              Typography.bodySmall,
              styles.systemStatusText,
              {
                color: systemStatusTextColor,
              },
            ]}
          >
            {systemStatusText}
          </Text>
        </View>

        {/* ================= HISTORY ================= */}
        <View style={styles.todaySection}>
          <Text
            style={[
              Typography.h4,
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Today’s rides
          </Text>

          <View style={styles.emptyRides}>
            <InactiveRideIcon width={72} height={72} />

            <Text
              style={[
                Typography.bodySmall,
                {
                  color: colors.textInactive,
                },
              ]}
            >
              No rides taken today
            </Text>
          </View>
        </View>
      </KeyboardAvoidingWrapper>

      {/* ================= QUICK ACTIONS ================= */}
      <View
        style={[
          styles.quickActionsContainer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.quickActions}>
          {/* SOS */}
          <Pressable
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.actionPressed,
            ]}
            onPress={() => router.push("/sos")}
            accessibilityRole="button"
            accessibilityLabel="Open SOS emergency screen"
          >
            <SosIcon width={15} height={15} />

            <Text style={[Typography.caption, styles.sosButtonText]}>SOS</Text>
          </Pressable>

          {/* CONTACTS */}
          <Pressable
            style={({ pressed }) => [
              styles.contactsButton,
              {
                borderColor: colors.primary,
              },
              pressed && styles.actionPressed,
            ]}
            onPress={() => router.push("/contact")}
            accessibilityRole="button"
            accessibilityLabel="Open emergency contacts"
          >
            <ContactIcon width={13} height={16} />

            <Text
              style={[
                Typography.caption,
                {
                  color: colors.primary,
                },
              ]}
            >
              Contacts
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ================= BOTTOM NAVIGATION ================= */}
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.half,
    position: "relative",
    zIndex: 10,
    elevation: 10,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },

  brandName: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.8,
  },

  greeting: {
    alignItems: "flex-end",
  },

  greetingHello: {
    textAlign: "right",
    fontSize: 16,
    lineHeight: 16,
  },

  greetingName: {
    fontSize: 20,
    lineHeight: 20,
  },
  statusSectionWrapper: {
    position: "relative",
    marginHorizontal: -Spacing.five,
    zIndex: 1,
  },

  statusGradient: {
    position: "absolute",

    top: -40,

    left: 0,
    right: 0,
    height: 100,

    zIndex: 0,
  },

  statusSection: {
    position: "relative",

    zIndex: 2,
    elevation: 2,

    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },

  deviceCards: {
    position: "relative",
    zIndex: 2,

    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },

  rideButton: {
    marginTop: Spacing.three,
    borderRadius: BorderRadius.full,
  },

  systemStatus: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.two,

    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },

  systemStatusIcon: {
    width: 14,
    height: 14,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: BorderRadius.full,
  },

  systemStatusText: {
    flex: 1,
    flexShrink: 1,
  },

  todaySection: {
    flex: 1,
    minHeight: 86,
    marginTop: Spacing.three,
  },

  sectionTitle: {
    fontSize: 16,
  },

  emptyRides: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingBottom: Spacing.two,
  },

  quickActionsContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },

  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },

  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.one,

    minHeight: 32,
    paddingHorizontal: Spacing.three,

    borderRadius: BorderRadius.full,

    backgroundColor: BrandColors.error,
  },

  sosButtonText: {
    color: BrandColors.secondary,
  },

  contactsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.one,

    minHeight: 32,
    paddingHorizontal: Spacing.three,

    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },

  actionPressed: {
    opacity: 0.75,
  },
});
