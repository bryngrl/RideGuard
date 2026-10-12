import { useTheme } from "@/shared/hooks";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useDeviceStore } from "../store/devices.store";

type DeviceStatus = {
  name: string;
  deviceId: string;
  batteryLevel: number | null;
};

export function DeviceStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { camera1DeviceId, camera2DeviceId, buttonDeviceId } = useDeviceStore();

  const devices: DeviceStatus[] = [
    { name: "Camera 1", deviceId: camera1DeviceId, batteryLevel: null },
    { name: "Camera 2", deviceId: camera2DeviceId, batteryLevel: null },
    { name: "Quick Button", deviceId: buttonDeviceId, batteryLevel: null },
  ];

  return (
    <PageLayout title="Camera and quick button">
      <View style={styles.content}>
        {devices.map((device) => {
          const isConnected = Boolean(device.deviceId);

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
                title={isConnected ? "Preview camera angle" : "Connect"}
                variant={isConnected ? "primary" : "outline"}
                fullWidth
                onPress={() => {
                  if (device.name.startsWith("Camera")) {
                    router.push(
                      `/devices/camera?camera=${device.name.endsWith("2") ? "2" : "1"}&source=settings` as never,
                    );
                  } else {
                    router.push("/devices/button?source=settings" as never);
                  }
                }}
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
