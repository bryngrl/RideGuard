import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { LoadingModal } from "@/components/ui/modal";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { auth } from "@/lib/firebase";
import { claimDevice } from "@/services/api";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

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
        router.replace("/metal-sensor/index");
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
            <Image
              source={require("@/assets/images/Primary-Icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Connect your{"\n"}metal sensor
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
              placeholder="e.g., MET-071-XKD"
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
              <Image
                source={require("@/assets/icons/lightbulb-icon.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
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
