import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { styles } from "./sos-countdown-screen.styles";

const COUNTDOWN_SECONDS = 5;

export function SosCountdownScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          router.replace("/sos/active" as any);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleCancelSOS = () => {
    router.replace("/sos" as any);
  };

  return (
    <PageLayout
      title="SOS"
      scrollable={false}
      showBackButton={false}
      footer={
        <SlideButton label="Slide to cancel" onComplete={handleCancelSOS} />
      }
    >
      <View style={styles.container}>
        <View style={styles.messageSection}>
          <Text style={[Typography.largeTitle, styles.title]}>
            Slide to cancel
          </Text>

          <Text style={[Typography.body, styles.description]}>
            After 10 seconds, your location will be sent to{"\n"}
            your emergency contacts.
          </Text>
        </View>

        <View style={styles.countdownSection}>
          <View style={styles.countdownOuter}>
            <View style={styles.countdownCircle}>
              <Text style={[Typography.largeTitle, styles.countdownText]}>
                {countdown}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
