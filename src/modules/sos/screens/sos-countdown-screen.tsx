import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { styles } from "./sos-countdown-screen.styles";

const COUNTDOWN_SECONDS = 10;
let countdownDeadline: number | null = null;

export function SosCountdownScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const ringScale = useSharedValue(1);
  const deadline = useRef(countdownDeadline ?? (Date.now() + COUNTDOWN_SECONDS * 1000));
  const transitioning = useRef(false);
  const [countdown, setCountdown] = useState(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));

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
    countdownDeadline = deadline.current;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0 && !transitioning.current) {
        transitioning.current = true;
        countdownDeadline = null;
        router.replace("/sos/active");
      }
    };
    const timer = setInterval(update, 250);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    update();
    return () => { clearInterval(timer); subscription.remove(); };
  }, [router]);

  const handleCancelSOS = () => {
    if (transitioning.current) return;
    transitioning.current = true;
    countdownDeadline = null;
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
            SOS will activate after 10 seconds. Slide left to cancel before then.
          </Text>
        </View>

        <View style={styles.countdownSection}>
          <Animated.View style={[styles.countdownOuter, ringMotion]}>
            <View style={styles.countdownCircle}>
              <Text style={[Typography.largeTitle, styles.countdownText]}>
                {countdown}
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </PageLayout>
  );
}
