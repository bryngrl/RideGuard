import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { useEffect, useState } from "react";
import {
  Image,
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
  const [failedToLoad, setFailedToLoad] = useState(false);
  useEffect(() => setFailedToLoad(false), [photoUrl]);
  const dimensionStyle = size
    ? { width: size, height: size, borderRadius: size / 2 }
    : undefined;

  if (photoUrl && !failedToLoad) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.avatar, dimensionStyle]}
        onError={() => setFailedToLoad(true)}
      />
    );
  }

  return (
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
