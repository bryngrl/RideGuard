import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, BackHandler, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useReducedMotion } from "react-native-reanimated";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { clearVerifiedSuccess, getVerifiedSuccess } from "../services/verified-success";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = 2 * Math.PI * 25;

export default function AccountVerifiedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [handoff] = useState(getVerifiedSuccess);
  const [progress] = useState(() => new Animated.Value(0));
  const [entrance] = useState(() => new Animated.Value(0));
  // The public success screen may also follow a server-confirmed code after a
  // restart. That handoff goes only to Login and grants no protected access.
  const loginRequired = handoff?.destination === "/(public)/sign-in";
  const valid = !!handoff && (loginRequired || auth.currentUser?.uid === handoff.uid && auth.currentUser.emailVerified);

  useEffect(() => {
    if (!valid || !handoff) return;
    let navigated = false;
    const back = BackHandler.addEventListener("hardwareBackPress", () => true);
    const appear = Animated.timing(entrance, { toValue: 1, duration: reducedMotion ? 0 : 450, useNativeDriver: true });
    const countdown = Animated.timing(progress, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false });
    appear.start();
    countdown.start(({ finished }) => {
      if (!finished || navigated || (!loginRequired && auth.currentUser?.uid !== handoff.uid)) return;
      navigated = true;
      clearVerifiedSuccess();
      router.replace(handoff.destination);
    });
    return () => { navigated = true; appear.stop(); countdown.stop(); back.remove(); };
  }, [valid, handoff, loginRequired, entrance, progress, reducedMotion, router]);

  if (!valid) return <Redirect href="/" />;
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <Stack.Screen options={{ gestureEnabled: false, animation: "fade" }} />
    <View style={styles.symbol}>
      <Animated.View style={[styles.ripple, { borderColor: theme.accent,
        opacity: reducedMotion ? 0 : progress.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 0.3, 0.15, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.55] }) }] }]} />
      <Animated.View style={[styles.check, { backgroundColor: theme.infoBackground, opacity: entrance,
        transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }] }]}>
        <Ionicons name="checkmark" size={64} color={theme.accent} />
      </Animated.View>
    </View>
    <Text style={[Typography.largeTitle, styles.center, { color: theme.text }]}>Account Verified!</Text>
    <Text style={[Typography.body, styles.description, { color: theme.textMuted }]}>
      {loginRequired ? "Your account has been successfully verified. Log in to continue." : "Your account has been successfully verified. Let's get you started."}
    </Text>
    <View accessible accessibilityLabel={loginRequired ? "Continuing to login automatically in three seconds" : "Continuing to setup automatically in three seconds"} style={styles.countdown}>
      <Svg width={60} height={60} viewBox="0 0 60 60">
        <Circle cx={30} cy={30} r={25} fill="none" stroke={theme.border} strokeWidth={3} />
        <AnimatedCircle cx={30} cy={30} r={25} fill="none" stroke={theme.accent} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [0, circumference] })}
          rotation={-90} origin="30, 30" />
      </Svg>
    </View>
    <Text style={[Typography.bodySmall, { color: theme.textMuted }]}>Getting started…</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.five },
  center: { textAlign: "center" },
  symbol: { width: 150, height: 150, alignItems: "center", justifyContent: "center", marginBottom: Spacing.five },
  ripple: { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2 },
  check: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  description: { textAlign: "center", maxWidth: 340, marginTop: Spacing.three },
  countdown: { marginTop: Spacing.five, marginBottom: Spacing.two },
});
