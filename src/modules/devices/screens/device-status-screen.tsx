import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";

import { releaseDevice } from "../services/devices.api";
import { useDeviceStore } from "../store/devices.store";

type DeviceStatus = {
  name: string;
  deviceId: string;
  batteryLevel: number | null;
  type: "camera" | "button";
  cameraNumber?: 1 | 2;
};

export function DeviceStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { camera1DeviceId, camera2DeviceId, buttonDeviceId } = useDeviceStore();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [deviceToDisconnect, setDeviceToDisconnect] = useState<DeviceStatus | null>(null);

  const devices: DeviceStatus[] = [
    {
      name: "Camera 1",
      deviceId: camera1DeviceId,
      batteryLevel: null,
      type: "camera",
      cameraNumber: 1,
    },
    {
      name: "Camera 2",
      deviceId: camera2DeviceId,
      batteryLevel: null,
      type: "camera",
      cameraNumber: 2,
    },
    {
      name: "Quick Button",
      deviceId: buttonDeviceId,
      batteryLevel: null,
      type: "button",
    },
  ];
  const focusedName = focus === "camera1" ? "Camera 1" : focus === "camera2" ? "Camera 2" : focus === "button" ? "Quick Button" : null;
  if (focusedName) devices.sort((a, b) => Number(b.name === focusedName) - Number(a.name === focusedName));

  const handleDeviceAction = (device: DeviceStatus) => {
    const isConnected = Boolean(device.deviceId);

    if (device.type === "button") {
      router.push(
        (isConnected
          ? "/(onboarding)/devices/button?source=settings"
          : "/(onboarding)/register/provision?source=settings") as never,
      );
      return;
    }

    const cameraNumber = device.cameraNumber ?? 1;
    router.push(
      (isConnected
        ? `/(onboarding)/devices/camera/camera-preview?camera=${cameraNumber}&source=settings`
        : `/(onboarding)/devices/camera?camera=${cameraNumber}&source=settings`) as never,
    );
  };

  const disconnectDevice = async (device: DeviceStatus) => {
    if (disconnectingId) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign in required", "Sign in to disconnect this device.");
      return;
    }

    setDisconnectingId(device.deviceId);
    try {
      await releaseDevice(device.deviceId, await user.getIdToken(true));
      const state = useDeviceStore.getState();
      if (state.camera1DeviceId === device.deviceId) {
        state.setCamera1DeviceId("");
        state.setCamera1Activated(false);
      }
      if (state.camera2DeviceId === device.deviceId) {
        state.setCamera2DeviceId("");
        state.setCamera2Activated(false);
      }
      if (state.buttonDeviceId === device.deviceId) {
        state.setButtonDeviceId("");
        state.setButtonActivated(false);
      }
    } catch (error) {
      Alert.alert(
        "Could not disconnect",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  const confirmDisconnect = () => {
    if (!deviceToDisconnect || disconnectingId) return;
    const device = deviceToDisconnect;
    setDeviceToDisconnect(null);
    void disconnectDevice(device);
  };

  return (
    <SettingsPageLayout title="Camera and quick button">
      <View style={styles.content}>
        {devices.map((device) => {
          const isConnected = Boolean(device.deviceId);
          const actionTitle =
            device.type === "button"
              ? isConnected
                ? "Test Quick Button"
                : "Connect Quick Button"
              : isConnected
                ? "Preview camera angle"
                : "Connect camera";

          return (
            <View key={device.name} style={styles.deviceSection}>
              <Text style={[Typography.h4, { color: theme.text }]}>
                {device.name}
              </Text>

              <View style={styles.infoRow}>
                <Text style={[Typography.body, { color: theme.text }]}>
                  Status
                </Text>
                <View style={styles.value}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isConnected
                          ? theme.success
                          : theme.textInactive,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      isConnected ? Typography.medium : Typography.body,
                      { color: isConnected ? theme.success : theme.textMuted },
                    ]}
                  >
                    {isConnected ? "Connected" : "Not connected"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[Typography.body, { color: theme.text }]}>
                  Battery
                </Text>
                <Text style={[Typography.body, { color: theme.textMuted }]}>
                  {device.batteryLevel === null
                    ? "Unavailable"
                    : `${device.batteryLevel}%`}
                </Text>
              </View>

              <Button
                title={actionTitle}
                variant={isConnected ? "primary" : "outline"}
                fullWidth
                style={styles.action}
                disabled={Boolean(disconnectingId)}
                onPress={() => handleDeviceAction(device)}
              />
              {isConnected && (
                <Button
                  title="Disconnect"
                  variant="danger"
                  fullWidth
                  style={styles.disconnect}
                  isLoading={disconnectingId === device.deviceId}
                  disabled={Boolean(disconnectingId)}
                  onPress={() => setDeviceToDisconnect(device)}
                />
              )}
            </View>
          );
        })}
      </View>
      <ConfirmationModal
        visible={deviceToDisconnect !== null}
        title={`Disconnect ${deviceToDisconnect?.name ?? "device"}?`}
        description="This device will no longer be linked to your account until you connect it again."
        primaryButtonText="Disconnect"
        secondaryButtonText="Cancel"
        primaryButtonColor={theme.error}
        maxWidth={320}
        onPrimaryPress={confirmDisconnect}
        onSecondaryPress={() => setDeviceToDisconnect(null)}
      />
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.five,
  },
  deviceSection: {
    gap: Spacing.two,
  },
  action: { marginTop: Spacing.two },
  disconnect: { borderWidth: 1 },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  value: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  statusDot: {
    borderRadius: 9999,
    height: 8,
    width: 8,
  },
});
