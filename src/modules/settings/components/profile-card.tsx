import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { normalizePhoneNumber } from "@/shared/lib/phone-utils";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { ProfileAvatar, getProfileDisplayName } from "@/shared/ui";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SettingsProfile } from "../types/settings.types";

export function ProfileCard({
  profile,
  progress,
  onPress,
}: {
  profile: SettingsProfile;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const colors = useTheme();
  const firstName = profile.firstName.trim();
  const front = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Animated.View style={[styles.card, front]}>
        <CardContent profile={profile} />
      </Animated.View>
      <Animated.View style={[styles.card, back]}>
        <LinearGradient
          colors={[colors.contactGradientStart, colors.contactGradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.backContent}>
            <Text style={[Typography.h3, { color: colors.text }]}>
              {firstName ? `${firstName}'s Vehicle` : "Your Vehicle"}
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.text }]}>
              {`${profile.vehicleBrand} ${profile.vehicleModel}`.trim() ||
                "No vehicle added"}
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.text }]}>
              {profile.plateNumber || "No plate number"}
            </Text>
          </View>

          <View style={styles.logoRow}>
            <MainLogo width={28} height={28} />
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function CardContent({ profile }: { profile: SettingsProfile }) {
  const colors = useTheme();
  return (
    <LinearGradient
      colors={[colors.contactGradientStart, colors.contactGradientEnd]}
      style={styles.gradient}
    >
      <View style={styles.content}>
        {/*  Avatar   */}
        <ProfileAvatar
          name={getProfileDisplayName(profile.firstName, profile.lastName)}
          photoUrl={profile.photoUrl}
          size={88}
          textStyle={Typography.h1}
        />

        <View
          style={[styles.divider, { backgroundColor: colors.textMuted + "40" }]}
        />
        <View style={styles.copy}>
          <Text style={[Typography.h3, { color: colors.text }]}>
            {getProfileDisplayName(profile.firstName, profile.lastName)}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.text }]}>
            {profile.phone
              ? `${normalizePhoneNumber(profile.phone)}`
              : "No phone number"}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.text }]}>
            {profile.email || "No email address"}
          </Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <MainLogo width={28} height={28} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: { minHeight: 150 },
  card: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: "hidden",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.two,
  },
  divider: {
    width: 0,
    height: "70%",
  },
  backContent: {
    flex: 1,
    justifyContent: "center",
  },
  copy: {
    gap: 2,
    flex: 1,
  },
  logoRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.one,
  },
});
