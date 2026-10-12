import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";

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
  const { camera1DeviceId, camera2DeviceId, buttonDeviceId } = useDeviceStore();

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

  const handleDeviceAction = (device: DeviceStatus) => {
    const isConnected = Boolean(device.deviceId);

    if (device.type === "button") {
      router.push(
        (isConnected
          ? "/(onboarding)/devices/button"
          : "/(onboarding)/register/provision") as never,
      );
      return;
    }

    const cameraNumber = device.cameraNumber ?? 1;
    router.push(
      (isConnected
        ? `/(onboarding)/devices/camera/camera-preview?camera=${cameraNumber}`
        : `/(onboarding)/devices/camera?camera=${cameraNumber}`) as never,
    );
  };

  return (
    <PageLayout title="Camera and quick button">
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
              <Text style={[Typography.h3, { color: theme.text }]}>
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
                  <Text style={[Typography.body, { color: theme.textMuted }]}>
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
                onPress={() => handleDeviceAction(device)}
              />
            </View>
          );
        })}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.five,
  },
  deviceSection: {
    gap: Spacing.two,
  },
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
