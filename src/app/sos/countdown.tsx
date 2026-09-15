import { PageLayout } from "@/components/ui/page-layout";
import { SlideButton } from "@/components/ui/slide-button";
import {
    BorderRadius,
    BrandColors,
    Spacing,
    Typography,
} from "@/constants/theme";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const COUNTDOWN_SECONDS = 5;

export default function SosCountdownScreen() {
  const router = useRouter();

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);

          router.replace("/sos/active");

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleCancelSOS = () => {
    router.replace("/sos");
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
        {/* HEADER / MESSAGE */}
        <View style={styles.messageSection}>
          <Text style={[Typography.largeTitle, styles.title]}>
            Slide to cancel
          </Text>

          <Text style={[Typography.body, styles.description]}>
            After 10 seconds, your location will be sent to{"\n"}
            your emergency contacts.
          </Text>
        </View>

        {/* COUNTDOWN */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  messageSection: {
    alignItems: "center",

    paddingTop: Spacing.four,
  },

  title: {
    color: BrandColors.primary,

    textAlign: "center",
  },

  description: {
    marginTop: Spacing.three,

    color: BrandColors.primary,

    textAlign: "center",

    lineHeight: 16,
  },

  countdownSection: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  countdownOuter: {
    width: 78,
    height: 78,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: BorderRadius.full,

    backgroundColor: "#FFE2E5",
  },

  countdownCircle: {
    width: 68,
    height: 68,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: BorderRadius.full,

    backgroundColor: BrandColors.error,
  },

  countdownText: {
    color: BrandColors.secondary,

    fontSize: 30,
    lineHeight: 38,

    textAlign: "center",
  },
});
