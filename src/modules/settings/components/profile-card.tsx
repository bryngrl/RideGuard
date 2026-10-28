import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatDisplayPhoneNumber } from "@/shared/lib/phone-utils";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { ProfileAvatar, getProfileDisplayName } from "@/shared/ui";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
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
    <Pressable onPress={onPress} style={styles.wrapper} feedbackEnabled={false} accessibilityRole="button" accessibilityLabel="Flip profile card">
      <Animated.View style={[styles.card, { borderColor: colors.border }, front]}>
        <CardContent profile={profile} />
      </Animated.View>
      <Animated.View style={[styles.card, { borderColor: colors.border }, back]}>
        <LinearGradient
          colors={[colors.contactGradientStart, colors.contactGradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.backContent}>
            <Text numberOfLines={1} style={[styles.backTitle, { color: colors.text }]}>
              {firstName ? `${firstName}’s vehicle` : "Your vehicle"}
            </Text>
            <Text numberOfLines={1} style={[styles.backDetail, { color: colors.text }]}>
              {`${profile.vehicleBrand} ${profile.vehicleModel}`.trim() ||
                "No vehicle added"}
            </Text>
            <Text numberOfLines={1} style={[styles.backDetail, { color: colors.text }]}>
              {profile.plateNumber || "No plate number"}
            </Text>
          </View>

          <View style={styles.logoRow}>
            <MainLogo color={colors.logo} width={22} height={30} />
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
          size={92}
          textStyle={Typography.h1}
        />

        <View style={styles.copy}>
          <Text numberOfLines={1} style={[Typography.bodyLarge, styles.name, { color: colors.text }]}>
            {getProfileDisplayName(profile.firstName, profile.lastName)}
          </Text>
          <Text numberOfLines={1} style={[Typography.bodySmall, styles.supportingText, { color: colors.text }]}>
            {profile.phone ? formatDisplayPhoneNumber(profile.phone) : "No phone number"}
          </Text>
          <Text numberOfLines={1} style={[Typography.bodySmall, styles.supportingText, { color: colors.text }]}>
            {profile.email || "No email address"}
          </Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <MainLogo color={colors.logo} width={22} height={30} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 148 },
  card: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: "hidden",
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: Spacing.four,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.five,
  },
  backContent: {
    flex: 1,
    gap: Spacing.half,
    paddingLeft: Spacing.two,
    paddingTop: Spacing.two,
  },
  backTitle: { ...Typography.bodyLarge, fontFamily: "Geist-SemiBold", lineHeight: 22 },
  backDetail: { ...Typography.bodySmall, fontSize: 12, lineHeight: 16 },
  copy: {
    gap: 0,
    flex: 1,
    paddingRight: Spacing.two,
  },
  name: { fontFamily: "Geist-SemiBold" },
  supportingText: { fontSize: 13 },
  logoRow: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.three,
  },
});
