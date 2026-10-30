import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { APIError } from "@/shared/api/errors";

import { disconnectHardwareDevice } from "../services/devices.api";
import { useDeviceStore } from "../store/devices.store";
import { useDeviceClaimLifecycle } from "../hooks/use-device-claim-lifecycle";
import { useCameras } from "@/modules/camera-sensor/hooks/use-cameras";
import { devicePresence } from "../utils/device-presence";
import { homeDeviceCards } from "@/modules/home/utils/home-device-cards";
import { useButtons } from "../hooks/use-buttons";

type DeviceStatus = {
  name: string;
  deviceId: string;
  type: "camera" | "button";
  cameraNumber?: 1 | 2;
};

export function DeviceStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const savedDevices = useDeviceStore();
  const cameraStatus = useCameras();
  const buttonStatus = useButtons();
  const status = { ...cameraStatus, ...buttonStatus };
  const cards = homeDeviceCards(status, savedDevices);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [deviceToDisconnect, setDeviceToDisconnect] = useState<DeviceStatus | null>(null);
  const lifecycle = useDeviceClaimLifecycle(() => {
    disconnectAbort.current?.abort();
    setDisconnectingId(null); setDeviceToDisconnect(null); setNotice(null);
  });
  const disconnectAbort = useRef<AbortController | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const hideNotice = useCallback(() => setNotice(null), []);
  useFocusEffect(useCallback(() => {
    setDisconnectingId(null); setDeviceToDisconnect(null); setNotice(null);
    return () => disconnectAbort.current?.abort();
  }, []));

  const devices: DeviceStatus[] = [
    {
      name: "Camera 1",
      deviceId: cards.camera1.deviceId,
      type: "camera",
      cameraNumber: 1,
    },
    {
      name: "Camera 2",
      deviceId: cards.camera2.deviceId,
      type: "camera",
      cameraNumber: 2,
    },
    {
      name: "Quick Button",
      deviceId: cards.button.deviceId,
      type: "button",
    },
  ];

  const handleDeviceAction = (device: DeviceStatus) => {
    if (device.type === "button") {
      router.push("/(app)/devices/quick-button");
      return;
    }

    const cameraNumber = device.cameraNumber ?? 1;
    router.push(
      (devicePresence(device, cameraStatus).online
        ? `/(onboarding)/devices/camera/camera-preview?camera=${cameraNumber}&source=settings`
        : `/(onboarding)/devices/camera?camera=${cameraNumber}&source=settings`) as never,
    );
  };

  const disconnectDevice = async (device: DeviceStatus) => {
    const user = auth.currentUser;
    if (!user) {
      setNotice({ message: "Sign in to disconnect this device.", type: "error" });
      return;
    }
    const current = useDeviceStore.getState();
    const selectedId = device.type === "button" ? current.buttonDeviceId
      : device.cameraNumber === 2 ? cards.camera2.deviceId : cards.camera1.deviceId;
    if (!device.deviceId || current.ownerUid !== user.uid || selectedId !== device.deviceId) return;
    const attempt = lifecycle.begin(user.uid);
    if (!attempt) return;
    const controller = new AbortController();
    disconnectAbort.current = controller;
    let rejectWait: (error: Error) => void = () => {};
    const interrupted = new Promise<never>((_resolve, reject) => { rejectWait = reject; });
    const stopWaiting = () => rejectWait(new Error("Disconnect interrupted"));
    controller.signal.addEventListener("abort", stopWaiting, { once: true });
    const timeout = setTimeout(() => controller.abort(), 20_000);
    setDisconnectingId(device.deviceId);
    setNotice(null);
    try {
      const token = await Promise.race([user.getIdToken(), interrupted]);
      if (!lifecycle.isCurrent(attempt) || controller.signal.aborted) return;
      await Promise.race([disconnectHardwareDevice(device.deviceId, token, device.type, controller.signal), interrupted]);
      if (!lifecycle.isCurrent(attempt)) return;
      void cameraStatus.refresh();
      void buttonStatus.refresh();
      setNotice({ message: `${device.name} marked disconnected. It remains paired and may reconnect automatically.`, type: "success" });
    } catch (error) {
      if (!lifecycle.isCurrent(attempt)) return;
      const message = error instanceof APIError && error.status === 401 ? "Session expired. Log in again."
        : error instanceof APIError && error.status === 403 ? "You can't disconnect this device."
        : error instanceof APIError && error.status === 404 ? "Device unavailable or disconnect not supported."
        : controller.signal.aborted ? "Couldn't confirm disconnection before the request timed out. Check device status before retrying."
        : "Couldn't disconnect device. Try again.";
      setNotice({ message, type: "error" });
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", stopWaiting);
      if (disconnectAbort.current === controller) disconnectAbort.current = null;
      if (lifecycle.isCurrent(attempt)) setDisconnectingId(null);
      lifecycle.finish(attempt);
    }
  };

  const confirmDisconnect = () => {
    if (!deviceToDisconnect || disconnectingId) return;
    const device = deviceToDisconnect;
    setDeviceToDisconnect(null);
    void disconnectDevice(device);
  };

  return (
    <SettingsPageLayout title="Camera and quick button" overlay={
      <NotificationSheet visible={!!notice} message={notice?.message ?? ""} type={notice?.type} onHide={hideNotice} />
    }>
      <View style={styles.content}>
        {devices.map((device) => {
          const isConnected = Boolean(device.deviceId);
          const presence = devicePresence(device, status);
          const actionTitle =
            device.type === "button"
              ? isConnected
                ? "Test Quick Button"
                : "Connect Quick Button"
              : presence.online
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
                        backgroundColor: presence.online
                          ? theme.success
                          : theme.textInactive,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      presence.online ? Typography.medium : Typography.body,
                      { color: presence.online ? theme.success : theme.textMuted },
                    ]}
                  >
                    {presence.label}
                  </Text>
                </View>
              </View>

              {device.type === "button" && isConnected && buttonStatus.buttonsSupported === false && <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>
                Live status is unavailable. Test your Quick Button to check physical presses.
              </Text>}

              {(device.type === "button" || presence.online || presence.canConnect) && <Button
                title={actionTitle}
                variant={isConnected ? "primary" : "outline"}
                fullWidth
                style={styles.action}
                disabled={Boolean(disconnectingId)}
                onPress={() => handleDeviceAction(device)}
              />}
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
        description="The device stays paired and may reconnect automatically when it reports activity."
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
