import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { sosStore, useSosStore } from "../store/sos.store";
import { styles } from "./sos-countdown-screen.styles";

export function SosCountdownScreen() {
  const router = useRouter();
  const state = useSosStore();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const ringScale = useSharedValue(1);
  useFocusEffect(useCallback(() => () => sosStore.getState().cancelCountdown(), []));

  useEffect(() => {
    if (reduceMotion) return;
    ringScale.value = withRepeat(
      withSequence(withTiming(1.025, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
    );
    return () => cancelAnimation(ringScale);
  }, [reduceMotion, ringScale]);
  const ringMotion = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }] }));

  useEffect(() => {
    if (state.phase === "countdown" || state.phase === "preparing") return;
    router.replace(state.phase === "idle" ? "/sos" : "/sos/active");
  }, [state.phase, router]);

  const handleCancelSOS = () => {
    state.cancelCountdown();
    router.replace("/sos");
  };

  return (
    <PageLayout
      title="SOS"
      scrollable={false}
      showBackButton={false}
      footerStyle={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      footer={
        <SlideButton label="Slide to cancel SOS" onComplete={handleCancelSOS} />
      }
    >
      <View style={styles.container}>
        <View style={styles.messageSection}>
          <Text style={[Typography.largeTitle, styles.title]}>
            Slide to cancel
          </Text>

          <Text style={[Typography.body, styles.description]}>
            RideGuard will request help after five seconds. Slide left to cancel before then.
          </Text>
        </View>

        <View style={styles.countdownSection}>
          <Animated.View style={[styles.countdownOuter, ringMotion]}>
            <View style={styles.countdownCircle}>
              <Text style={[Typography.largeTitle, styles.countdownText]}>
                {state.remaining}
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </PageLayout>
  );
}
