import { styles } from "./provision-screen.styles";
import MainLogo from "@/assets/icons//logos/main.svg";
import LighBulb from "@/assets/icons/actions/lightbulb.svg";
import { auth } from "@/lib/firebase";
import { useDeviceStore } from "@/modules/devices";
import { useDeviceClaimLifecycle } from "@/modules/devices/hooks/use-device-claim-lifecycle";
import { claimDevice } from "../services/onboarding.api";
import { useTheme } from "@/shared/hooks/use-theme";
import { buttonId as normalizeButtonId, formatButtonId, validButtonId } from "@/shared/lib/input-formats";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import { LoadingModal } from "@/shared/ui/modal";
import Stepper from "@/shared/ui/stepper";
import { CustomTextInput } from "@/shared/ui/text-input";
import { skipHardware } from "../services/skip-hardware";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, Text, View } from "react-native";

export default function ButtonProvisionScreen({ source: entrySource }: { source?: "settings" } = {}) {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const fromSettings = entrySource === "settings" || source === "settings";
  const theme = useTheme();
  const setButtonDeviceId = useDeviceStore((state) => state.setButtonDeviceId);

  const [buttonId, setButtonId] = useState("");
  const [buttonIdError, setButtonIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const claim = useDeviceClaimLifecycle(() => {
    setIsLoading(false);
    setAlertState({ visible: false, status: "loading", message: "" });
  });

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    status: "loading" | "success" | "error";
    message: string;
  }>({
    visible: false,
    status: "loading",
    message: "",
  });

  useFocusEffect(useCallback(() => {
    setIsLoading(false);
    setAlertState({ visible: false, status: "loading", message: "" });
  }, []));

  const handleConnect = async () => {
    if (isLoading || alertState.visible) return;

    setButtonIdError("");

    const cleanedButtonId = formatButtonId(buttonId);

    // validation
    if (!buttonId) {
      setButtonIdError("This field is required.");
      return;
    }
    if (!validButtonId(buttonId)) {
      setButtonIdError("Incorrect format.");
      return;
    }

    // check for auth user
    const user = auth.currentUser;
    const attempt = claim.begin(user?.uid ?? null);
    if (!attempt) return;

    if (!user) {
      setAlertState({
        visible: true,
        status: "error",
        message: "Log in to connect a device.",
      });

      claim.schedule(attempt, () => {
        setAlertState((prev) => ({
          ...prev,
          visible: false,
        }));
        claim.finish(attempt);
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
      if (!claim.isCurrent(attempt)) return;

      await claimDevice(cleanedButtonId, firebaseToken);
      if (!claim.isCurrent(attempt)) return;

      // Save claimed button
      setButtonDeviceId(cleanedButtonId);

      // Show success modal
      setAlertState({
        visible: true,
        status: "success",
        message: "Quick Button connected",
      });

      // Redirect after success
      claim.schedule(attempt, () => {
        if (fromSettings) router.replace("/(app)/devices/quick-button");
        else router.replace("/(onboarding)/devices/button");
      }, 1500);
    } catch (error: unknown) {
      if (!claim.isCurrent(attempt)) return;
      const message =
        error instanceof Error ? error.message : "Button ID not recognized.";

      setAlertState({
        visible: true,
        status: "error",
        message,
      });

      claim.schedule(attempt, () => {
        setAlertState((prev) => ({
          ...prev,
          visible: false,
        }));
        claim.finish(attempt);
      }, 2500);
    } finally {
      if (claim.isCurrent(attempt)) setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isLoading || alertState.visible) return;
    const attempt = claim.begin(auth.currentUser?.uid ?? null);
    if (!attempt) return;
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      await skipHardware("connection-skipped");
      if (claim.isCurrent(attempt)) router.replace("/(onboarding)/register/mpin");
    } catch {
      if (claim.isCurrent(attempt)) setButtonIdError("Couldn't save setup progress. Try again.");
    } finally {
      if (claim.isCurrent(attempt)) setIsLoading(false);
      claim.finish(attempt);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        {!fromSettings && <Stepper currentStep={7} steps={10} />}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <MainLogo color={theme.logo} width={64} height={64} />
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
              labelStyle={{ color: theme.text }}
              placeholder="e.g., BUT-123-ABC"
              autoCapitalize="characters"
              autoCorrect={false}
              value={buttonId}
              inputFormat={{ normalize: normalizeButtonId, format: formatButtonId }}
              error={buttonIdError}
              onBlur={() => {
                if (buttonId && !validButtonId(buttonId)) setButtonIdError("Incorrect format.");
              }}
              onChangeText={(text) => {
                setButtonId(text);

                if (buttonIdError) {
                  setButtonIdError("");
                }
                if (validButtonId(text) && !validButtonId(buttonId)) {
                  requestAnimationFrame(() => Keyboard.dismiss());
                }
              }}
              containerStyle={{
                paddingBottom: Spacing.two,
              }}
            />
          </View>
        </View>

        <KeyboardHiddenView style={styles.footerSection}>
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
            {!fromSettings && <Button title="Skip for now" variant="ghost" onPress={handleSkip}
              disabled={isLoading || alertState.visible} style={{ marginTop: Spacing.two }} />}
          </View>
        </KeyboardHiddenView>

        <LoadingModal
          visible={alertState.visible}
          status={alertState.status}
          message={alertState.message}
        />
      </View>
    </KeyboardAvoidingWrapper>
  );
}
