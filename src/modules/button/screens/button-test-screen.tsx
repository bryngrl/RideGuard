import MainLogo from "@/assets/icons//logos/main.svg";
import WarningIcon from "@/assets/icons/logos/yellow-warning.svg";
import RedBase from "@/assets/icons/sensors/button/onboarding/red-button/red-base.svg";
import RedBodyDefault from "@/assets/icons/sensors/button/onboarding/red-button/red-body-default.svg";
import RedBodyPressed from "@/assets/icons/sensors/button/onboarding/red-button/red-body-pressed.svg";
import WhiteBase from "@/assets/icons/sensors/button/onboarding/white-button/white-base.svg";
import WhiteBodyDefault from "@/assets/icons/sensors/button/onboarding/white-button/white-body-default.svg";
import WhiteBodyPressed from "@/assets/icons/sensors/button/onboarding/white-button/white-body-pressed.svg";
import SuccessIcon from "@/assets/icons/status/success.svg";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import Stepper from "@/shared/ui/stepper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ButtonTestType = "short" | "long";
type TestState = "waiting" | "success" | "timeout";
type ButtonColor = "white" | "red";

const TEST_TIMEOUT = 3 * 60 * 1000;
const HOLD_DURATION = 3000;

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
  const [state, setState] = useState<TestState>("waiting");
  const [recognizedButtons, setRecognizedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const pressStart = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const loaderAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const [pressedButtons, setPressedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    timeoutRef.current = null;
    progressRef.current = null;
  };

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setState("timeout");
    }, TEST_TIMEOUT);
  };

  const startLoaderAnimation = () => {
    loaderAnimation.current?.stop();

    dots.forEach((dot) => dot.setValue(0));

    loaderAnimation.current = Animated.loop(
      Animated.sequence([
        ...dots.flatMap((dot) => [
          Animated.timing(dot, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(180),
      ]),
    );

    loaderAnimation.current.start();
  };

  useEffect(() => {
    resetTimeout();
    startLoaderAnimation();

    return () => {
      clearTimers();
      loaderAnimation.current?.stop();
    };
  }, [testType]);

  const handleButtonPressStart = (button: ButtonColor) => {
    if (state !== "waiting") return;
    setPressedButtons((current) => ({ ...current, [button]: true }));
    if (testType === "long") {
      pressStart.current = Date.now();
      setIsHolding(true);
      setProgress(0);
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - (pressStart.current ?? Date.now());
        setProgress(Math.min(elapsed / HOLD_DURATION, 1));
        if (elapsed >= HOLD_DURATION) {
          clearTimers();
          setIsHolding(false);
          setProgress(0);
          setState("success");
          setPressedButtons({ white: false, red: false });
          loaderAnimation.current?.stop();
        }
      }, 50);
    }
  };

  const handleButtonPressEnd = (button: ButtonColor) => {
    if (state !== "waiting") return;
    if (testType === "short") {
      setTimeout(
        () => setPressedButtons((current) => ({ ...current, [button]: false })),
        180,
      );
      setRecognizedButtons((current) => {
        const next = { ...current, [button]: true };
        if (next.white && next.red) {
          clearTimers();
          loaderAnimation.current?.stop();
          setState("success");
          setTimeout(() => router.replace("/devices/button/test-page"), 700);
        }
        return next;
      });
      return;
    }

    clearTimers();
    pressStart.current = null;
    setIsHolding(false);
    setProgress(0);
    setPressedButtons((current) => ({ ...current, [button]: false }));
    resetTimeout();
  };

  const handleRetry = () => {
    clearTimers();
    setIsHolding(false);
    setProgress(0);
    setState("waiting");
    setRecognizedButtons({ white: false, red: false });
    setPressedButtons({ white: false, red: false });

    resetTimeout();
    startLoaderAnimation();
  };

  const handleSkip = () => {
    clearTimers();
    router.replace("/(onboarding)/register/complete-setup");
  };

  const renderButton = (button: ButtonColor) => {
    const isWhite = button === "white";

    const body = isWhite ? (
      pressedButtons.white ? (
        <View style={styles.pressedBody}>
          <WhiteBodyPressed width={110} height={90} />
        </View>
      ) : (
        <WhiteBodyDefault width={120} height={90} />
      )
    ) : pressedButtons.red ? (
      <View style={styles.pressedBody}>
        <RedBodyPressed width={110} height={90} />
      </View>
    ) : (
      <RedBodyDefault width={120} height={90} />
    );

    return (
      <View style={styles.buttonVisual}>
        <View style={styles.buttonBase}>
          {isWhite ? (
            <WhiteBase width={120} height={90} />
          ) : (
            <RedBase width={120} height={90} />
          )}
        </View>

        <View style={styles.buttonBody}>{body}</View>

        <Pressable
          style={styles.bodyTarget}
          onPressIn={() => handleButtonPressStart(button)}
          onPressOut={() => handleButtonPressEnd(button)}
          disabled={state === "success"}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View>
          <Stepper currentStep={7} steps={10} size={6} />

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
            <>
              {isHolding && (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
              )}

              {isHolding && (
                <Text
                  style={[
                    Typography.body,
                    styles.holdingText,
                    { color: theme.textMuted },
                  ]}
                >
                  Holding...
                </Text>
              )}

              {!isHolding && state !== "success" && (
                <View style={styles.status}>
                  <View style={styles.statusRow}>
                    <View style={styles.statusIconSlot}>
                      <View style={styles.dots}>
                        {dots.map((dot, index) => (
                          <Animated.View
                            key={index}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: theme.text,
                                transform: [
                                  {
                                    translateY: dot.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, -7],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={[Typography.body, { color: theme.primary }]}>
                      Waiting for long press
                    </Text>
                  </View>
                  <Text
                    style={[
                      Typography.body,
                      styles.statusSubtitle,
                      { color: theme.textMuted },
                    ]}
                  >
                    Hold and press your physical red button.
                  </Text>
                </View>
              )}

              {state === "success" && (
                <View style={styles.successFooter}>
                  <View style={styles.statusRow}>
                    <View style={styles.statusIconSlot}>
                      <SuccessIcon width={24} height={24} />
                    </View>

                    <Text style={[Typography.body, { color: theme.text }]}>
                      Red button long press recognized
                    </Text>
                  </View>

                  <Button
                    title="Continue"
                    size="md"
                    fullWidth
                    onPress={() =>
                      router.replace("/(onboarding)/register/complete-setup")
                    }
                    style={styles.continueButton}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.status}>
              {recognizedButtons.white || recognizedButtons.red ? (
                (["white", "red"] as ButtonColor[])
                  .filter(
                    (button) =>
                      recognizedButtons[button] ||
                      !recognizedButtons.white ||
                      !recognizedButtons.red,
                  )
                  .map((button) => {
                    const recognized = recognizedButtons[button];
                    const label =
                      button === "white" ? "White button" : "Red button";

                    return (
                      <View key={button} style={styles.statusRow}>
                        <View style={styles.statusIconSlot}>
                          {recognized ? (
                            <SuccessIcon width={24} height={24} />
                          ) : (
                            <View style={styles.dots}>
                              {dots.map((dot, index) => (
                                <Animated.View
                                  key={index}
                                  style={[
                                    styles.dot,
                                    {
                                      backgroundColor: theme.text,
                                      transform: [
                                        {
                                          translateY: dot.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -7],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                />
                              ))}
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            Typography.body,
                            {
                              color: recognized ? theme.text : theme.primary,
                            },
                          ]}
                        >
                          {recognized
                            ? `${label} short press recognized`
                            : `Waiting for ${button} button short press`}
                        </Text>
                      </View>
                    );
                  })
              ) : (
                <>
                  <View style={styles.statusRow}>
                    <View style={styles.statusIconSlot}>
                      <View style={styles.dots}>
                        {dots.map((dot, index) => (
                          <Animated.View
                            key={index}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: theme.text,
                                transform: [
                                  {
                                    translateY: dot.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, -7],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    <Text style={[Typography.body, { color: theme.primary }]}>
                      Waiting for press
                    </Text>
                  </View>
                  <Text
                    style={[
                      Typography.body,
                      styles.statusSubtitle,
                      { color: theme.textMuted },
                    ]}
                  >
                    Press your physical white button and red button once.
                  </Text>
                </>
              )}
            </View>
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

  buttonVisual: {
    position: "relative",
    width: 120,
    height: 90,
  },

  buttonBase: {
    position: "absolute",
    top: 25,
    left: -2,
    width: 120,
    height: 90,
  },

  buttonBody: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 120,
    height: 90,
  },

  pressedBody: {
    position: "absolute",
    top: 7,
    left: 5,
    width: 120,
    height: 90,
  },

  bodyTarget: {
    position: "absolute",
    top: 0,
    left: 9,
    right: 9,
    height: 70,
  },

  centerText: {
    marginTop: Spacing.two,
    textAlign: "center",
  },

  footer: {
    paddingHorizontal: Spacing.three,
    width: "100%",
    height: 95,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  status: {
    alignItems: "flex-start",
    paddingTop: 30,
  },

  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    columnGap: Spacing.two,
    justifyContent: "center",
  },

  statusText: {
    marginTop: Spacing.two,
    textAlign: "left",
  },

  statusIconSlot: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },

  dots: {
    flexDirection: "row",
    gap: 1,
  },

  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },

  progressTrack: {
    marginTop: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderColor: Colors.light.border,
    borderWidth: 2,
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

  statusSubtitle: {
    marginTop: Spacing.one,
    textAlign: "left",
    paddingLeft: 40,
  },

  holdingText: {
    marginTop: Spacing.two,
    textAlign: "center",
  },

  successFooter: {
    width: "100%",
    alignItems: "flex-start",
  },

  continueButton: {
    marginTop: Spacing.four,
    marginBottom: 0,
  },
  secondaryButton: {
    marginTop: Spacing.one,
  },
});
