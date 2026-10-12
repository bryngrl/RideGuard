import { styles } from "./provision-screen.styles";
import MainLogo from "@/assets/icons//logos/main.svg";
import LighBulb from "@/assets/icons/actions/lightbulb.svg";
import { auth } from "@/lib/firebase";
import { claimDevice } from "../services/onboarding.api";
import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { LoadingModal } from "@/shared/ui/modal";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ProvisionTokenScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setMetalDeviceId } = useDeviceStore();

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

    // validation
    if (!cleanedId) {
      setDeviceIdError("This field is required.");
      return;
    }

    // check for auth user
    const user = auth.currentUser;

    if (!user) {
      setAlertState({
        visible: true,
        status: "error",
        message: "You must be signed in to connect a device.",
      });

      setTimeout(() => {
        setAlertState((prev) => ({
          ...prev,
          visible: false,
        }));
      }, 2500);

      return;
    }

    try {
      setIsLoading(true);

      // modal
      setAlertState({
        visible: true,
        status: "loading",
        message: "Verifying device...",
      });
      const firebaseToken = await user.getIdToken(true);

      await claimDevice(cleanedId, firebaseToken);

      // Save claimed device
      setMetalDeviceId(cleanedId);

      // Show success modal
      setAlertState({
        visible: true,
        status: "success",
        message: "Successfully connected",
      });

      // Redirect after success
      setTimeout(() => {
        router.replace("/(onboarding)/devices/button");
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Device ID not recognized.";

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
              Connect your{"\n"}metal sensor
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
              Enter your unique device identifier to continue.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomTextInput
              label="Device ID"
              required
              labelStyle={{ color: BrandColors.primary }}
              placeholder="e.g., MET-071-XKD"
              autoCapitalize="characters"
              value={deviceId}
              error={deviceIdError}
              onChangeText={(text) => {
                setDeviceId(text.toUpperCase());

                if (deviceIdError) {
                  setDeviceIdError("");
                }
              }}
              containerStyle={{
                paddingBottom: Spacing.two,
              }}
            />
          </View>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.helpContainer}>
            <View style={styles.iconContainer}>
              <LighBulb width={24} height={24} />
            </View>

            <View style={styles.helpTextContainer}>
              <Text
                style={[
                  Typography.h4,
                  {
                    color: theme.text,
                    fontSize: 14,
                  },
                ]}
              >
                Where to find your Device ID
              </Text>

              <Text
                style={[
                  Typography.bodySmall,
                  {
                    color: theme.textMuted,
                    marginTop: Spacing.one,
                  },
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
              fullWidth
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
