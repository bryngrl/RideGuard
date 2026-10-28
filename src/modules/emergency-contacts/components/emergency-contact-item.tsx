import { StyleSheet, Text, View } from "react-native";
import { CachedPhoto } from "@/shared/ui/cached-photo";

import { useTheme } from "@/shared/hooks/use-theme";
import { formatLocalMobile, localMobile, validLocalMobile } from "@/shared/lib/input-formats";
import { Spacing, Typography } from "@/shared/theme";

interface EmergencyContactItemProps {
  name: string;
  phoneNumber: string;
  profileImage?: string;
}

export function EmergencyContactItem({
  name,
  phoneNumber,
  profileImage,
}: EmergencyContactItemProps) {
  const colors = useTheme();

  const localNumber = localMobile(phoneNumber);
  const displayPhone = validLocalMobile(localNumber) ? formatLocalMobile(localNumber) : phoneNumber;
  const placeholder = <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
    <Text style={[Typography.bodyLarge, styles.initial, { color: colors.text }]}>{name.trim().charAt(0).toUpperCase()}</Text>
  </View>;

  return (
    <View style={styles.container}>
      {profileImage ? <CachedPhoto uri={profileImage} style={styles.avatar} placeholder={placeholder} /> : placeholder}

      <View style={styles.info}>
        <Text
          style={[
            Typography.medium,
            styles.name,
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
          {displayPhone}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 24,
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

  name: {
    fontSize: 16,
    lineHeight: 24,
  },

  phone: {
    fontSize: 14,
    marginTop: 2,
  },
  initial: { fontFamily: "Geist-SemiBold" },
});
