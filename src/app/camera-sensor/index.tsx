import LightBulb from "@/assets/icons/lightbulb-icon.svg";
import MainLogo from "@/assets/icons/main-logo.svg";
import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { LoadingModal } from "@/components/ui/modal";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { claimDevice } from "@/features/devices/devices.api";
import { useTheme } from "@/hooks/use-theme";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProvisionCameraScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setCameraDeviceId } = useDeviceStore();

  const [deviceId, setDeviceId] = useState("");
  const [deviceIdError, setDeviceIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    status: "loading" | "success" | "error";
    message: string;
  }>({
    visible: false,
    status: "loading",
    message: "",
  });

  const handleConnect = async () => {
    if (isLoading) return;

    setDeviceIdError("");

    const cleanedId = deviceId.trim().toUpperCase();

    if (!cleanedId) {
      setDeviceIdError("This field is required.");
      return;
    }

    // validate cam ID
    if (!cleanedId.startsWith("CAM-")) {
      setDeviceIdError("Please enter a valid Camera Device ID.");
      return;
    }

    try {
      setIsLoading(true);

      setAlertState({
        visible: true,
        status: "loading",
        message: "Verifying camera...",
      });

      // claim camera device
      await claimDevice(cleanedId);

      // Save cam dev
      setCameraDeviceId(cleanedId);

      setAlertState({
        visible: true,
        status: "success",
        message: "Camera successfully connected",
      });

      // Navigate after success
      setTimeout(() => {
        router.replace("/camera-sensor/camera-preview");
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Camera Device ID not recognized.";

      setAlertState({
        visible: true,
        status: "error",
        message,
      });

      setTimeout(() => {
        setAlertState((prev) => ({
          ...prev,
          visible: false,
        }));
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo width={64} height={64} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Connect your{"\n"}camera
            </Text>
            <Text
              style={[
                Typography.body,
                { color: theme.textMuted, marginTop: Spacing.two },
              ]}
            >
              Enter your unique device identifier to continue.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomTextInput
              label="Device ID"
              required
              labelStyle={{ color: BrandColors.primary }}
              placeholder="e.g., CAM-482-QLZ"
              autoCapitalize="characters"
              value={deviceId}
              error={deviceIdError}
              onChangeText={(text) => {
                setDeviceId(text.toUpperCase());
                if (deviceIdError) setDeviceIdError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
            />
          </View>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.helpContainer}>
            <View style={[styles.iconContainer, {}]}>
              <LightBulb width={24} height={24} />
            </View>
            <View style={styles.helpTextContainer}>
              <Text
                style={[Typography.h4, { color: theme.text, fontSize: 14 }]}
              >
                Where to find your Device ID
              </Text>
              <Text
                style={[
                  Typography.bodySmall,
                  { color: theme.textMuted, marginTop: Spacing.one },
                ]}
              >
                Look for the printed label on the back of the device.
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Connect"
              variant="primary"
              size="md"
              fullWidth={true}
              onPress={handleConnect}
              isLoading={isLoading}
            />
          </View>
        </View>

        <LoadingModal
          visible={alertState.visible}
          status={alertState.status}
          message={alertState.message}
        />
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
    paddingTop: 72,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  formContainer: {
    marginTop: Spacing.one,
  },
  footerSection: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.three,
  },
  helpTextContainer: {
    flex: 1,
  },
  buttonContainer: {
    width: "100%",
  },
});
