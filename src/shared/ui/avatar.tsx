import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { CachedPhoto } from "./cached-photo";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";

export function getProfileDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim() || "Your account";
}

export interface ProfileAvatarProps {
  name: string;
  size?: number; // Optional size prop
  textStyle?: StyleProp<TextStyle>; // Optional text style prop for scaling letters
  // The account's profile photo (e.g. from Google sign-in). Falls back to
  // the initial below when absent or when it fails to load.
  photoUrl?: string | null;
}

export function ProfileAvatar({
  name,
  size,
  textStyle,
  photoUrl,
}: ProfileAvatarProps) {
  const colors = useTheme();
  const [attempt, setAttempt] = useState(0);
  // Retry the same URL on returning to the screen after a transient failure.
  useFocusEffect(useCallback(() => { setAttempt((value) => value + 1); }, [photoUrl]));
  const dimensionStyle = size
    ? { width: size, height: size, borderRadius: size / 2 }
    : undefined;

  const placeholder = (
    <View
      style={[
        styles.avatar,
        { backgroundColor: colors.primary },
        dimensionStyle,
      ]}
    >
      <Text style={[Typography.h3, { color: colors.textInverse }, textStyle]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
  return photoUrl?.trim()
    ? <CachedPhoto key={`${photoUrl}/${attempt}`} uri={photoUrl.trim()} style={[styles.avatar, dimensionStyle]}
        placeholder={placeholder} label="Loading profile photo" />
    : placeholder;
}

const styles = StyleSheet.create({
  avatar: {
    width: Spacing.six,
    height: Spacing.six,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
