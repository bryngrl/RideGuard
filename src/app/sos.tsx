import { PageLayout } from "@/components/ui/page-layout";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useEffect } from "react";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function SosScreen() {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.35);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.18, {
          duration: 1200,
        }),
        withTiming(1, {
          duration: 1200,
        }),
      ),
      -1,
      false,
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.1, {
          duration: 1200,
        }),
        withTiming(0.35, {
          duration: 1200,
        }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: pulseScale.value,
        },
      ],
      opacity: pulseOpacity.value,
    };
  });

  return (
    <PageLayout title="SOS" scrollable={false}>
      <View style={styles.container}>
        {/* ================= SOS SECTION ================= */}
        <View style={styles.sosSection}>
          <View style={styles.sosWrapper}>
            {/* BREATHING PULSE */}
            <Animated.View style={[styles.pulseCircle, animatedPulseStyle]} />

            {/* SOS BUTTON */}
            <Pressable
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

          {/* ================= EMERGENCY CONTACTS ================= */}
          <View style={styles.contactsSection}>
            <View style={styles.avatars}>
              {/* PROFILE IMAGE */}
              <Image
                source={{
                  uri: "https://i.pravatar.cc/150?img=47",
                }}
                style={styles.avatar}
              />

              {/* INITIAL CONTACT */}
              <View style={[styles.avatar, styles.initialAvatar]}>
                <Text style={styles.initialText}>N</Text>
              </View>

              {/* INITIAL CONTACT */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sosSection: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  sosWrapper: {
    width: 230,
    height: 230,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= PULSE ================= */

  pulseCircle: {
    position: "absolute",

    width: 210,
    height: 210,

    borderRadius: BorderRadius.full,

    backgroundColor: "#DCE8F8",
  },

  /* ================= SOS BUTTON ================= */

  sosButton: {
    width: 190,
    height: 190,

    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.two,

    borderRadius: BorderRadius.full,

    backgroundColor: BrandColors.primary,

    zIndex: 2,
  },

  sosButtonPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  sosText: {
    color: BrandColors.secondary,
    textAlign: "center",
  },

  sosHint: {
    color: BrandColors.secondary,
    textAlign: "center",
  },

  /* ================= CONTACTS ================= */

  contactsSection: {
    alignItems: "center",

    marginTop: Spacing.seven,
  },

  avatars: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "center",

    marginBottom: Spacing.three,
  },

  avatar: {
    width: 38,
    height: 38,

    borderRadius: BorderRadius.full,

    marginHorizontal: -4,

    borderWidth: 2,
    borderColor: BrandColors.secondary,
  },

  initialAvatar: {
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: BrandColors.primary,
  },

  initialText: {
    color: BrandColors.secondary,

    fontSize: 14,
    fontWeight: "600",
  },

  contactsDescription: {
    textAlign: "center",

    lineHeight: 20,

    color: BrandColors.primary,
  },
});
