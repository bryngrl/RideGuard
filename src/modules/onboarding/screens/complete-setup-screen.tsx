import { styles } from "./complete-setup-screen.styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { useOnboardingStore } from "../store/onboarding.store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { auth } from "@/lib/firebase";
import { clearRegistrationOnboardingPending } from "@/modules/auth/services/registration-progress";
import { mpinApi, mpinErrorMessage, MpinError } from "@/modules/mpin/services/mpin.api";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { checkIsOldUser } from "@/modules/auth/services/auth.api";
import { completeOnboarding } from "@/modules/auth/services/onboarding-progress.api";

export default function CompleteSetupScreen() {
  const router = useRouter();
  const theme = useTheme();

  const firstName = useOnboardingStore((state) => state.firstName);

  const [isLoading, setIsLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  const checkMpin = useCallback(async (signal: AbortSignal) => {
    const user = auth.currentUser;
    if (!user || !mpinApi.enabled) throw new MpinError("unavailable");
    const token = await user.getIdToken(true);
    if (!await checkIsOldUser(token)) {
      if (!signal.aborted) router.replace("/(onboarding)/register/profile");
      return false;
    }
    const status = await mpinApi.status(token, signal);
    if (signal.aborted) return false;
    if (auth.currentUser?.uid !== user.uid) throw new MpinError("expired-session");
    if (!status.configured) {
      router.replace("/(onboarding)/register/mpin");
      return false;
    }
    return true;
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void checkMpin(controller.signal).then((configured) => {
      if (!controller.signal.aborted) setReady(configured);
    }).catch((reason) => {
      if (!controller.signal.aborted) setError(mpinErrorMessage(reason));
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [checkMpin]);

  const displayName =
    firstName && firstName.trim() !== "" ? firstName.trim() : "driver";

  const handleStartDriving = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsLoading(true);
    setError(null);

    try {
      if (!await checkMpin(new AbortController().signal)) return;
      const user = auth.currentUser;
      if (!user) throw new MpinError("expired-session");
      await completeOnboarding(await user.getIdToken());
      if (auth.currentUser?.uid !== user.uid) throw new MpinError("expired-session");
      setReady(true);
      await clearRegistrationOnboardingPending(auth.currentUser?.email);
      useAuthStore.getState().setIsOldUser(true);
      router.replace("/(app)/(tabs)");
    } catch (reason) {
      setError(mpinErrorMessage(reason));
    } finally {
      pending.current = false;
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <Image source={require("@/assets/images/all-set-icon.png")}
            style={{ width: 96, height: 96, marginBottom: Spacing.four }}
            resizeMode="contain" fadeDuration={0} accessibilityLabel="RideGuard" />
          {!ready ? <>{error ? <FormFeedback message={error} /> : <ActivityIndicator color={theme.accent} />}</> : <>

          <Text
            style={[Typography.largeTitle, styles.title, { color: theme.text }]}
          >
            You're all set,{"\n"}
            {displayName}
          </Text>

          <Text
            style={[
              Typography.body,
              styles.subtitle,
              { color: theme.textMuted },
            ]}
          >
            Your account is set up and ready to use.
          </Text>
          {error ? <FormFeedback message={error} /> : null}
          </>}
        </View>

        <View style={styles.footer}>
          <Button
            title={ready ? "Start driving" : "Retry"}
            variant="primary"
            size="md"
            fullWidth
            onPress={handleStartDriving}
            isLoading={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
