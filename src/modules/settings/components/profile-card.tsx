import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
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
          <Text style={[Typography.h3, { color: colors.text }]}>Vehicle</Text>
          <Text style={[Typography.body, { color: colors.text }]}>
            {`${profile.vehicleBrand} ${profile.vehicleModel}`.trim() ||
              "No vehicle added"}
          </Text>
          <Text
            style={[
              Typography.h3,
              { color: colors.text, marginTop: Spacing.four },
            ]}
          >
            Plate number
          </Text>
          <Text style={[Typography.body, { color: colors.text }]}>
            {profile.plateNumber || "No plate number"}
          </Text>
          <MainLogo width={48} height={48} />
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
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[Typography.h2, { color: colors.textInverse }]}>
          {profile.firstName.charAt(0).toUpperCase() || "R"}
        </Text>
      </View>
      <Text style={[Typography.h2, { color: colors.text }]}>
        {`${profile.firstName} ${profile.lastName}`.trim() || "Your profile"}
      </Text>
      <Text style={[Typography.body, { color: colors.text }]}>
        {profile.phone ? `+63 ${profile.phone}` : "No phone number"}
      </Text>
      <Text style={[Typography.body, { color: colors.text }]}>
        {profile.email || "No email address"}
      </Text>
      <MainLogo width={48} height={48} />
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  wrapper: { minHeight: 250 },
  card: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: "hidden",
    borderRadius: 18,
    overflow: "hidden",
  },
  gradient: { flex: 1, padding: Spacing.four, gap: Spacing.two },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
});
