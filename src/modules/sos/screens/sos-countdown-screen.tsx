import { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { Button } from "@/shared/ui/button";
import { sosStore, useSosStore } from "../store/sos.store";
import { styles } from "./sos-countdown-screen.styles";

export function SosCountdownScreen() {
  const router = useRouter();
  const state = useSosStore();
  useFocusEffect(useCallback(() => () => sosStore.getState().cancelCountdown(), []));
  useEffect(() => {
    if (state.phase === "countdown" || state.phase === "preparing") return;
    router.replace(state.phase === "idle" ? "/sos" : "/sos/active");
  }, [state.phase, router]);
  const cancel = () => { state.cancelCountdown(); router.replace("/sos"); };
  return <PageLayout title="SOS" scrollable={false} onBack={cancel}
    footer={<View style={{ gap: 12 }}><SlideButton label="Slide to cancel" onComplete={cancel} />
      <Button title="Cancel SOS" variant="ghost" onPress={cancel} /></View>}>
    <View style={styles.container}>
      <View style={styles.messageSection}>
        <Text style={[Typography.largeTitle, styles.title]}>Requesting help</Text>
        <Text style={[Typography.body, styles.description]}>After five seconds, RideGuard will request help from your saved emergency contacts. Cancel before the timer ends to send nothing.</Text>
      </View>
      <View style={styles.countdownSection}><View style={styles.countdownOuter}><View style={styles.countdownCircle}>
        <Text accessibilityLiveRegion="polite" style={[Typography.largeTitle, styles.countdownText]}>{state.remaining}</Text>
      </View></View></View>
    </View>
  </PageLayout>;
}
