import { useCallback, useEffect } from "react";
import { BackHandler, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { SlideButton } from "@/shared/ui/slide-button";
import { actionFooterPadding } from "@/shared/theme";
import { sosStore, useSosStore } from "../store/sos.store";
import { countdownColors, styles } from "./sos-countdown-screen.styles";

export function SosCountdownScreen() {
  const router = useRouter();
  const state = useSosStore();
  const scheme = useColorScheme();
  const colors = countdownColors[scheme];
  const { bottom } = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const size = Math.min(160, Math.max(96, width * 0.28, 96 * Math.min(fontScale, 1.5)));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  useFocusEffect(useCallback(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      sosStore.getState().cancelCountdown();
      router.replace("/sos");
      return true;
    });
    return () => {
      back.remove();
      sosStore.getState().cancelCountdown();
    };
  }, [router]));
  useEffect(() => {
    if (state.phase === "countdown" || state.phase === "preparing") return;
    router.replace(state.phase === "idle" ? "/sos" : "/sos/active");
  }, [state.phase, router]);
  const cancel = () => { state.cancelCountdown(); router.replace("/sos"); };
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
    <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    <View style={[styles.header, { borderBottomColor: colors.divider }]}>
      <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.heading }]}>SOS</Text>
    </View>
    <View style={[styles.content, { paddingBottom: actionFooterPadding(bottom, true) }]}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
      <View style={styles.messageSection}>
        <Text style={[styles.title, { color: colors.heading }]}>Slide to cancel</Text>
        <Text style={[styles.description, { color: colors.muted }]}>Your emergency contacts will be notified when the countdown ends.</Text>
      </View>
      <View style={styles.countdownSection}>
        <View style={[styles.countdownCircle, { width: size, height: size }]}>
          <Svg width={size} height={size} accessible={false}>
            <Circle cx={size / 2} cy={size / 2} r={radius} fill={colors.accent} stroke={colors.ring} strokeWidth={8} />
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.accent}
              strokeWidth={8} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, state.remaining / 5)))}
              rotation={-90} origin={`${size / 2}, ${size / 2}`} />
          </Svg>
          <View style={styles.countdownValue} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${state.remaining} seconds remaining`}>
            <Text style={[styles.countdownText, { color: colors.onAccent }]}>{state.remaining}</Text>
            <Text style={[styles.seconds, { color: colors.onAccent }]}>seconds</Text>
          </View>
        </View>
      </View>
      </ScrollView>
      <View style={styles.footer}>
        <SlideButton label="Slide to cancel" onComplete={cancel} direction="right" thumbSymbol="×"
          style={styles.slider} trackColor={colors.track} borderColor={colors.border}
          thumbColor={colors.accent} labelColor={colors.accent} arrowColor={colors.onAccent} />
        <Text style={[styles.hint, { color: colors.muted }]}>
          Nothing is sent until the countdown ends. Cancelling won&apos;t restart it.
        </Text>
      </View>
    </View>
  </SafeAreaView>;
}
