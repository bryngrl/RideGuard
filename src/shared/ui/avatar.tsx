import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

export function getProfileDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim() || "Jovilyn";
}

export interface ProfileAvatarProps {
  name: string;
  size?: number; // Optional size prop
  textStyle?: StyleProp<TextStyle>; // Optional text style prop for scaling letters
}

export function ProfileAvatar({ name, size, textStyle }: ProfileAvatarProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: colors.primary,
          // If a custom size is passed, override the default dimensions
          ...(size
            ? { width: size, height: size, borderRadius: size / 2 }
            : {}),
        },
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
