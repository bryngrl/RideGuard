import { styles } from "./provision-screen.styles";
import MainLogo from "@/assets/icons//logos/main.svg";
import LighBulb from "@/assets/icons/actions/lightbulb.svg";
import { auth } from "@/lib/firebase";
import { useDeviceStore } from "@/modules/devices";
import { claimDevice } from "../services/onboarding.api";
import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { LoadingModal } from "@/shared/ui/modal";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ButtonProvisionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setButtonDeviceId = useDeviceStore((state) => state.setButtonDeviceId);

  const [buttonId, setButtonId] = useState("");
  const [buttonIdError, setButtonIdError] = useState("");
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

    setButtonIdError("");

    const cleanedButtonId = buttonId.trim().toUpperCase();

    // validation
    if (!cleanedButtonId) {
      setButtonIdError("This field is required.");
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
        message: "Verifying Quick Button...",
      });
      const firebaseToken = await user.getIdToken(true);

      await claimDevice(cleanedButtonId, firebaseToken);

      // Save claimed button
      setButtonDeviceId(cleanedButtonId);

      // Show success modal
      setAlertState({
        visible: true,
        status: "success",
        message: "Quick Button connected",
      });

      // Redirect after success
      setTimeout(() => {
        router.replace("/(onboarding)/devices/button");
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Button ID not recognized.";

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
              Connect your{"\n"}Quick Button
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
              Enter your Quick Button identifier to continue.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomTextInput
              label="Button ID"
              required
              labelStyle={{ color: BrandColors.primary }}
              placeholder="e.g., BTN-071-XKD"
              autoCapitalize="characters"
              value={buttonId}
              error={buttonIdError}
              onChangeText={(text) => {
                setButtonId(text.toUpperCase());

                if (buttonIdError) {
                  setButtonIdError("");
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
                Where to find your Button ID
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
                Look for the printed label on the back of the Quick Button.
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
