import MainLogo from "@/assets/icons//logos/main.svg";
import WarningIcon from "@/assets/icons/logos/yellow-warning.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import Stepper from "@/shared/ui/stepper";
import { BACK_ARROW_TOUCH_LEFT, BACK_ARROW_TOUCH_SIZE, BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ButtonTestStatus } from "../components/button-test-status";
import { ButtonTestVisual } from "../components/button-test-visual";
import { ButtonHoldProgress } from "../components/button-hold-progress";
import { useDeviceStore } from "@/modules/devices/store/devices.store";
import { useButtons } from "@/modules/devices/hooks/use-buttons";
import { useButtonTest } from "../hooks/use-button-test";
import type { ButtonColor, ButtonTestType } from "../types/button-test";

export function ButtonTestScreen({
  test = "short",
  source,
}: {
  test?: ButtonTestType;
  source?: "settings";
}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ test?: string; source?: string }>();
  const testType: ButtonTestType =
    params.test === "long" || test === "long" ? "long" : "short";
  const theme = useTheme();
  const fromSettings = source === "settings" || params.source === "settings";
  const buttonDeviceId = useDeviceStore((state) => state.buttonDeviceId);
  useButtons(); // Restore this account's assigned ID before receiving hardware events.
  const {
    state,
    recognizedButtons,
    pressedButtons,
    connectionState,
    handleRetry,
  } = useButtonTest(testType, () => {
    if (fromSettings) router.dismissTo("/devices");
    else router.replace("/(onboarding)/devices/button/test-page");
  });

  const handleSkip = () => {
    if (fromSettings) router.dismissTo("/devices");
    else router.replace("/(onboarding)/register/mpin");
  };

  const renderButton = (color: ButtonColor) => (
    <ButtonTestVisual
      color={color}
      isPressed={pressedButtons[color]}
    />
  );

  const renderShortStatus = () => {
    if (!recognizedButtons.white && !recognizedButtons.red) {
      return (
        <View style={styles.status}>
          <ButtonTestStatus
            text="Waiting for press"
            color={theme.primary}
            subtitle="Press your physical white button and red button once."
            subtitleColor={theme.textMuted}
            iconColor={theme.text}
          />
        </View>
      );
    }

    return (
      <View style={styles.status}>
        {(["white", "red"] as ButtonColor[])
          .filter(
            (button) =>
              recognizedButtons[button] ||
              !recognizedButtons.white ||
              !recognizedButtons.red,
          )
          .map((button) => (
            <ButtonTestStatus
              key={button}
              success={recognizedButtons[button]}
              text={
                recognizedButtons[button]
                  ? `${button === "white" ? "White" : "Red"} button short press recognized`
                  : `Waiting for ${button} button short press`
              }
              color={recognizedButtons[button] ? theme.text : theme.textMuted}
              iconColor={theme.text}
            />
          ))}
      </View>
    );
  };

  const renderLongStatus = () => {
    if (state === "success") {
      return (
        <>
          <ButtonTestStatus
            success
            text="Red button long press recognized"
            color={theme.text}
            subtitleColor={theme.textMuted}
          />
          <Button
            title="Continue"
            onPress={() =>
              fromSettings ? router.dismissTo("/devices") : router.replace("/(onboarding)/register/mpin")
            }
            style={styles.continueButton}
          />
        </>
      );
    }

    if (pressedButtons.red) return <ButtonHoldProgress color={theme.text} borderColor={theme.border} />;
    return (
      <ButtonTestStatus
        text="Waiting for long press"
        color={theme.textMuted}
        subtitle="Hold and press your physical red button."
        subtitleColor={theme.textMuted}
      />
    );
  };

  const content = (
    <View style={styles.container}>
      <View>
        {fromSettings && (
          <Pressable onPress={handleSkip} style={styles.backButton} feedbackRadius={16} feedbackInsets={Spacing.two} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Go back">
            <BackArrowIcon color={theme.text} />
          </Pressable>
        )}
        {!fromSettings && <Stepper
          currentStep={testType === "short" ? 7 : 8}
          steps={10}
          size={4}
        />}

        <View style={[styles.logoContainer, fromSettings && styles.settingsLogo]}>
          {state === "timeout" ? (
            <WarningIcon width={74} height={74} />
          ) : (
            <MainLogo color={theme.logo} width={64} height={64} />
          )}
        </View>

        <Text style={[Typography.largeTitle, { color: theme.text }]}>
          {state === "timeout"
            ? "No press detected"
            : `Test ${testType} press`}
        </Text>

        <Text
          style={[
            Typography.body,
            { color: theme.textMuted, marginTop: Spacing.two },
          ]}
        >
          {state === "timeout"
            ? "Make sure your physical button is powered on and nearby."
            : testType === "short"
              ? "Give the button a quick, single press."
              : "Press and hold the button for 3 seconds."}
        </Text>
      </View>

      {state === "timeout" ? (
        <View style={styles.center} />
      ) : (
        <View style={styles.center}>
          {testType === "short" && renderButton("white")}
          {renderButton("red")}
        </View>
      )}

      <View style={styles.footer}>
        {!buttonDeviceId ? (
          <>
            <ButtonTestStatus
              text="Connect your Quick Button"
              color={theme.text}
              subtitle="Enter the Button ID printed on your device to start the press test."
              subtitleColor={theme.textMuted}
            />
            <Button title="Enter Button ID" onPress={() => router.push(
              fromSettings ? "/(app)/devices/button-setup" : "/(onboarding)/register/provision",
            )} style={styles.continueButton} />
          </>
        ) : state === "waiting" && connectionState !== "ready" ? (
          <>
            <ButtonTestStatus
              text={connectionState === "error" ? "Couldn't connect to Quick Button" : "Connecting to Quick Button…"}
              color={connectionState === "error" ? theme.error : theme.textMuted}
              subtitle={connectionState === "error" ? "Check your internet connection and try again." : undefined}
              subtitleColor={theme.textMuted}
            />
            {connectionState === "error" && <Button title="Try again" onPress={handleRetry} style={styles.continueButton} />}
            {!fromSettings && <Button title="Skip for now" variant="ghost" onPress={handleSkip} style={styles.secondaryButton} />}
          </>
        ) : state === "timeout" ? (
          <>
            <Button title="Try again" onPress={handleRetry} />
            {!fromSettings && <Button
              title="Skip for now"
              variant="ghost"
              onPress={handleSkip}
              style={styles.secondaryButton}
            />}
          </>
        ) : testType === "long" ? (
          renderLongStatus()
        ) : (
          renderShortStatus()
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingWrapper contentContainerStyle={fromSettings ? styles.settingsContent : undefined}>
      {content}
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  settingsContent: { paddingTop: Spacing.two },
  backButton: {
    width: BACK_ARROW_TOUCH_SIZE,
    height: BACK_ARROW_TOUCH_SIZE,
    marginLeft: BACK_ARROW_TOUCH_LEFT - Spacing.five,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLogo: { marginTop: Spacing.six, marginBottom: Spacing.four },
  logoContainer: {
    marginBottom: Spacing.three,
    marginTop: Spacing.four,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: Spacing.four,
  },
  footer: {
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  status: {
    alignItems: "flex-start",
  },
  continueButton: {
    marginTop: Spacing.two,
  },
  secondaryButton: {
    marginTop: Spacing.one,
  },
});
