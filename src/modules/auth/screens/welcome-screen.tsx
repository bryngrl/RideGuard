import MainLogo from "@/assets/icons/logos/main.svg";
import { BrandNameReveal } from "@/components/brand-name-reveal";
import { BrandLockup } from "@/components/brand-lockup";
import { BrandColors, Spacing } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

const SIGNAL_RING_SIZES = [0.811, 0.94, 1.08] as const;
const SIGNAL_RING_DURATION = 3800;
const SIGNAL_RING_STAGGER = 650;

function SignalRing({ size, index, active }: { size: number; index: number; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    progress.value = 0;
    progress.value = withDelay(
      index * SIGNAL_RING_STAGGER,
      withRepeat(
        withTiming(1, { duration: SIGNAL_RING_DURATION, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [active, index, progress, reduceMotion]);

  const signalMotion = useAnimatedStyle(() => ({
    // Each ring resets while invisible, keeping the repeating scan seamless.
    opacity: reduceMotion ? 0.7 : Math.pow(Math.sin(Math.PI * progress.value), 2),
    transform: [{ scale: reduceMotion ? 1 : 0.965 + progress.value * 0.07 }],
  }));

  return (
    <Animated.View
      style={[
        styles.signalRing,
        { width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2 },
        signalMotion,
      ]}
    />
  );
}

type WelcomeScreenProps = {
  startup?: boolean;
  showLanding?: boolean;
};

export default function WelcomeScreen({ startup = false, showLanding = true }: WelcomeScreenProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [wordmarkWidth, setWordmarkWidth] = useState(0);
  const entrance = useSharedValue(0);
  const secondaryEntrance = useSharedValue(0);
  const logoTravel = useSharedValue(startup ? 0 : 1);
  const ambientProgress = useSharedValue(0);
  const haloSize = Math.min(width * 0.94, 380);
  const heroLift = Math.min(56, height * 0.065);
  const ambientActive = showLanding && focused && appActive;

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!ambientActive || reduceMotion) return;
    ambientProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(ambientProgress);
  }, [ambientActive, ambientProgress, reduceMotion]);

  useEffect(() => {
    entrance.value = withTiming(showLanding ? 1 : 0, {
      duration: reduceMotion ? 0 : 500,
      easing: Easing.out(Easing.cubic),
    });
    secondaryEntrance.value = showLanding
      ? withDelay(
          reduceMotion ? 0 : 130,
          withTiming(1, {
            duration: reduceMotion ? 0 : 520,
            easing: Easing.out(Easing.cubic),
          }),
        )
      : withTiming(0, { duration: reduceMotion ? 0 : 180 });
  }, [entrance, reduceMotion, secondaryEntrance, showLanding]);

  useEffect(() => {
    if (!startup || !wordmarkWidth) return;
    const timeout = setTimeout(() => {
      logoTravel.value = withTiming(1, {
        duration: reduceMotion ? 0 : 750,
        easing: Easing.inOut(Easing.cubic),
      });
    }, reduceMotion ? 0 : 650);
    return () => clearTimeout(timeout);
  }, [logoTravel, reduceMotion, startup, wordmarkWidth]);

  const brandMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -heroLift * entrance.value }],
  }));
  const logoMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: -((wordmarkWidth - 15) / 2) * logoTravel.value }],
  }), [wordmarkWidth]);
  const revealMotion = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: 18 * (1 - entrance.value) }],
  }));
  const secondaryMotion = useAnimatedStyle(() => ({
    opacity: secondaryEntrance.value,
    transform: [{ translateY: 12 * (1 - secondaryEntrance.value) }],
  }));
  const haloMotion = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: -heroLift * entrance.value },
      { scale: 0.96 + entrance.value * 0.04 },
    ],
  }));
  const reflectionMotion = useAnimatedStyle(() => ({
    transform: [
      { translateX: haloSize * (-0.28 + ambientProgress.value * 0.56) },
      { translateY: haloSize * (0.1 - ambientProgress.value * 0.2) },
      { rotate: "-28deg" },
    ],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[styles.halo, { width: haloSize, height: haloSize, marginTop: -haloSize / 2 }, haloMotion]}
      >
        <View style={styles.haloDisc}>
          <Svg width="100%" height="100%" viewBox="0 0 360 360">
            <Defs>
              <RadialGradient id="haloSurface" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#E5EFFF" />
                <Stop offset="24%" stopColor="#EAF2FF" />
                <Stop offset="48%" stopColor="#F3F8FF" />
                <Stop offset="70%" stopColor="#FBFDFF" />
                <Stop offset="88%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#FFFFFF" />
              </RadialGradient>
            </Defs>
            <Rect width="360" height="360" fill="url(#haloSurface)" />
          </Svg>
          <Animated.View style={[styles.haloReflection, reflectionMotion]}>
            <Svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id="haloReflection" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.05" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect width="200" height="400" fill="url(#haloReflection)" />
            </Svg>
          </Animated.View>
        </View>
        {SIGNAL_RING_SIZES.map((ratio, index) => (
          <SignalRing
            key={ratio}
            size={haloSize * ratio}
            index={index}
            active={ambientActive}
          />
        ))}
      </Animated.View>
      <Animated.View style={[styles.brandAnchor, brandMotion]} accessibilityLabel="RideGuard">
        {startup ? (
          <>
            <View
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants"
              style={styles.measureWordmark}
              onLayout={(event) => setWordmarkWidth(event.nativeEvent.layout.width)}
            >
              <BrandNameReveal reveal={false} />
            </View>
            <Animated.View style={[styles.startupLogo, logoMotion]}>
              <MainLogo width={64} height={64} />
            </Animated.View>
            <View style={[styles.startupWordmark, { transform: [{ translateX: (49 - wordmarkWidth) / 2 }] }]}>
              <BrandNameReveal />
            </View>
          </>
        ) : (
          <BrandLockup />
        )}
      </Animated.View>
      <Animated.View style={[styles.actions, revealMotion]} pointerEvents={showLanding ? "auto" : "none"}>
        <View style={styles.actionContent}>
          <Button
            title="Log in"
            onPress={() => router.push("/(public)/sign-in")}
            style={styles.action}
          />
          <Animated.View style={secondaryMotion}>
            <Button
              title="Create account"
              onPress={() => router.push("/(public)/create-account")}
              variant="ghost"
              style={styles.action}
              textStyle={styles.secondaryActionText}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.secondary, overflow: "hidden" },
  halo: { position: "absolute", top: "50%", alignSelf: "center" },
  haloDisc: {
    position: "absolute",
    top: "9.45%",
    left: "9.45%",
    width: "81.1%",
    height: "81.1%",
    overflow: "hidden",
  },
  haloReflection: {
    position: "absolute",
    left: "16%",
    top: "-30%",
    width: "68%",
    height: "160%",
  },
  signalRing: {
    position: "absolute",
    top: "50%",
    left: "50%",
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: "#CEDFF9",
  },
  brandAnchor: { position: "absolute", top: "50%", left: 0, right: 0, marginTop: -32, alignItems: "center" },
  measureWordmark: { position: "absolute", opacity: 0, left: -1000 },
  startupLogo: { position: "absolute", top: 2.5, left: "50%", marginLeft: -32 },
  startupWordmark: { position: "absolute", top: 25, left: "50%" },
  actions: { position: "absolute", bottom: Spacing.six, left: 0, right: 0, alignItems: "center" },
  actionContent: { width: "100%", maxWidth: 440, paddingHorizontal: Spacing.five, gap: Spacing.three },
  action: { height: 42 },
  secondaryActionText: { color: BrandColors.primary },
});
