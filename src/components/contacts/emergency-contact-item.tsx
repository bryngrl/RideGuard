import { StyleSheet, Text, View } from "react-native";

import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.three,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",
  },

  initial: {
    fontWeight: "500",
  },

  info: {
    flex: 1,
    marginLeft: Spacing.three,
  },

  phone: {
    marginTop: 2,
  },
});
