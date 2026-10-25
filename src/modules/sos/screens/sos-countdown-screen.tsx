import { useCallback, useEffect } from "react";
import { BackHandler, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { SlideButton } from "@/shared/ui/slide-button";
import { sosStore, useSosStore } from "../store/sos.store";
import { countdownColors, styles } from "./sos-countdown-screen.styles";

export function SosCountdownScreen() {
  const router = useRouter();
  const state = useSosStore();
  const colors = countdownColors[useColorScheme()];
  const { width } = useWindowDimensions();
  const size = Math.min(216, width * 0.54);
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
    <StatusBar style="light" />
    <View style={styles.content}>
      <View style={styles.messageSection}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>STARTING SOS</Text>
        <Text style={styles.title}>Notifying your contacts in</Text>
      </View>
      <View style={styles.countdownSection}>
        <View style={[styles.countdownCircle, { width: size, height: size }]}>
          <Svg width={size} height={size} accessible={false}>
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.ring} strokeWidth={8} />
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.accent}
              strokeWidth={8} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, state.remaining / 5)))}
              rotation={-90} origin={`${size / 2}, ${size / 2}`} />
          </Svg>
          <View style={styles.countdownValue} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${state.remaining} seconds remaining`}>
            <Text style={styles.countdownText}>{state.remaining}</Text>
            <Text style={styles.seconds}>seconds</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <SlideButton label="Slide to cancel" onComplete={cancel} direction="right" thumbSymbol="×"
          style={styles.slider} trackColor={colors.track} borderColor={colors.border}
          thumbColor="#FFFFFF" labelColor="#FFFFFF" arrowColor="#DF1014" />
        <Text style={[styles.hint, { color: colors.muted }]}>
          Nothing is sent until the countdown ends. Cancelling won&apos;t restart it.
        </Text>
      </View>
    </View>
  </SafeAreaView>;
}
