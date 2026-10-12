import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { styles } from "./sos-trigger-screen.styles";

export function SosTriggerScreen() {
  const router = useRouter();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.35);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      false,
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 1200 }),
        withTiming(0.35, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [pulseOpacity, pulseScale]);

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const handleSendSOS = () => {
    router.replace("/sos/countdown" as any);
  };

  return (
    <PageLayout title="SOS" scrollable={false}>
      <View style={styles.container}>
        <View style={styles.sosSection}>
          <View style={styles.sosWrapper}>
            <Animated.View style={[styles.pulseCircle, animatedPulseStyle]} />

            <Pressable
              onPress={handleSendSOS}
              style={({ pressed }) => [
                styles.sosButton,
                pressed && styles.sosButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send SOS emergency alert"
            >
              <Text style={[Typography.h2, styles.sosText]}>
                Tap to{"\n"}send SOS
              </Text>

              <Text style={[Typography.caption, styles.sosHint]}>
                (or press and hold)
              </Text>
            </Pressable>
          </View>

          <View style={styles.contactsSection}>
            <View style={styles.avatars}>
              <Image
                source={{
                  uri: "https://i.pravatar.cc/150?img=47",
                }}
                style={styles.avatar}
              />

              <View style={[styles.avatar, styles.initialAvatar]}>
                <Text style={styles.initialText}>N</Text>
              </View>

              <View style={[styles.avatar, styles.initialAvatar]}>
                <Text style={styles.initialText}>N</Text>
              </View>
            </View>

            <Text style={[Typography.bodySmall, styles.contactsDescription]}>
              Your SOS will be sent to your emergency{"\n"}contacts
            </Text>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
