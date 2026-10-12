import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

interface EmergencyContactItemProps {
  name: string;
  phoneNumber: string;
}

export function EmergencyContactItem({
  name,
  phoneNumber,
}: EmergencyContactItemProps) {
  const colors = useTheme();

  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.backgroundSelected,
          },
        ]}
      >
        <Text
          style={[
            Typography.bodyLarge,
            styles.initial,
            {
              color: colors.text,
            },
          ]}
        >
          {initial}
        </Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[
            Typography.medium,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text
          style={[
            Typography.medium,
            styles.phone,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {phoneNumber}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 9999,
    height: 48,
    justifyContent: "center",
    width: 48,
  },

  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.three,
  },

  info: {
    flex: 1,
    justifyContent: "center",
  },

  initial: {
    fontFamily: "Geist-SemiBold",
  },

  phone: {
    fontSize: 14,
    marginTop: 2,
  },
});
