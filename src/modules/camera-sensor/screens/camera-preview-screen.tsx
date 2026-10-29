import MainLogo from "@/assets/icons//logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Stepper } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDeviceStore } from "@/modules/devices/store/devices.store";
import { useCameras } from "../hooks/use-cameras";
import { CameraPreviewFrame, HardwareCameraPreview } from "../components/camera-preview-frame";

export function CameraPreviewScreen() {
  const router = useRouter();
  const { camera, source } = useLocalSearchParams<{ camera?: string; source?: string }>();
  const fromSettings = source === "settings";
  const theme = useTheme();
  const navigating = useRef(false);
  const isSecondCamera = camera === "2";
  const deviceId = useDeviceStore((state) => isSecondCamera ? state.camera2DeviceId : state.camera1DeviceId);
  const { cameras, isLoading, error } = useCameras();
  const selectedCamera = cameras.find((item) => item.source !== "phone" && item.deviceId === deviceId);
  const cameraLabel = isSecondCamera ? "Camera 2" : "Camera 1";
  useFocusEffect(useCallback(() => { navigating.current = false; }, []));

  const handleDone = () => {
    if (navigating.current) return;
    navigating.current = true;
    if (fromSettings) router.dismissTo("/devices");
    else router.replace(isSecondCamera ? "/(onboarding)/register/provision" : "/devices/camera?camera=2");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        {!fromSettings && <View style={styles.stepperContainer}>
          <Stepper currentStep={isSecondCamera ? 6 : 5} steps={10} size={4} />
        </View>}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo color={theme.logo} width={64} height={64} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Camera angle{"\n"}preview
            </Text>
            <Text
              style={[
                Typography.body,
                {
                  color: theme.textMuted,
                  marginTop: Spacing.two,
                },
              ]}
            >
              Check the camera angle and keep the passenger seat within frame.
            </Text>
          </View>
        </View>

        <CameraPreviewFrame>
          <HardwareCameraPreview camera={selectedCamera} label={cameraLabel} loading={isLoading} error={error}
            onConnect={() => router.replace({ pathname: "/(onboarding)/devices/camera", params: {
              camera: isSecondCamera ? "2" : "1", ...(fromSettings ? { source: "settings" } : {}),
            } })} />
        </CameraPreviewFrame>

        <View style={styles.footerContainer}>
          <Button
            title="Done"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleDone}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  stepperContainer: { alignItems: "center", marginBottom: Spacing.five },

  footerContainer: {
    marginTop: "auto",
    paddingTop: Spacing.two,
    width: "100%",
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.three,
  },
  topSection: {},
});
