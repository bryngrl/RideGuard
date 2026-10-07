import MainLogo from "@/assets/icons//logos/main.svg";
import WarningIcon from "@/assets/icons/logos/yellow-warning.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import Stepper from "@/shared/ui/stepper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ButtonTestStatus } from "../components/button-test-status";
import { ButtonTestVisual } from "../components/button-test-visual";
import { useButtonTest } from "../hooks/use-button-test";
import type { ButtonColor, ButtonTestType } from "../types/button-test";

export function ButtonTestScreen({
  test = "short",
}: {
  test?: ButtonTestType;
}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ test?: string }>();
  const testType: ButtonTestType =
    params.test === "long" || test === "long" ? "long" : "short";
  const theme = useTheme();
  const {
    state,
    recognizedButtons,
    progress,
    isHolding,
    pressedButtons,
    handleButtonPressStart,
    handleButtonPressEnd,
    handleRetry,
  } = useButtonTest(testType, () =>
    router.replace("/devices/button/test-page"),
  );

  const handleSkip = () => {
    router.replace("/(onboarding)/register/complete-setup");
  };

  const renderButton = (color: ButtonColor) => (
    <ButtonTestVisual
      color={color}
      isPressed={pressedButtons[color]}
      onPressStart={() => handleButtonPressStart(color)}
      onPressEnd={() => handleButtonPressEnd(color)}
      disabled={state === "success"}
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
    if (isHolding) {
      return (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text
            style={[
              Typography.body,
              styles.holdingText,
              { color: theme.textMuted },
            ]}
          >
            Holding...
          </Text>
        </>
      );
    }

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
              router.replace("/(onboarding)/register/complete-setup")
            }
            style={styles.continueButton}
          />
        </>
      );
    }

    return (
      <ButtonTestStatus
        text="Waiting for long press"
        color={theme.textMuted}
        subtitle="Hold and press your physical red button."
        subtitleColor={theme.textMuted}
      />
    );
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View>
          <Stepper
            currentStep={testType === "short" ? 7 : 8}
            steps={10}
            size={6}
          />

          <View style={styles.logoContainer}>
            {state === "timeout" ? (
              <WarningIcon width={74} height={74} />
            ) : (
              <MainLogo width={64} height={64} />
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
          {state === "timeout" ? (
            <>
              <Button title="Try again" onPress={handleRetry} />
              <Button
                title="Skip for now"
                variant="ghost"
                onPress={handleSkip}
                style={styles.secondaryButton}
              />
            </>
          ) : testType === "long" ? (
            renderLongStatus()
          ) : (
            renderShortStatus()
          )}
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
  logoContainer: {
    marginBottom: Spacing.three,
    marginTop: Spacing.four,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  footer: {
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  status: {
    alignItems: "flex-start",
  },
  progressTrack: {
    backgroundColor: "#E4E7EC",
    borderRadius: 8,
    height: 12,
    overflow: "hidden",
    width: "70%",
    alignSelf: "center",
  },
  progressFill: {
    backgroundColor: "#1A2B4C",
    borderRadius: 8,
    height: "100%",
  },
  holdingText: {
    marginTop: Spacing.two,
    textAlign: "center",
  },
  continueButton: {
    marginTop: Spacing.two,
  },
  secondaryButton: {
    marginTop: Spacing.one,
  },
});
