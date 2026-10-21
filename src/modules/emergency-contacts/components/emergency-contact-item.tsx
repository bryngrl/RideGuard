import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { formatLocalMobile, localMobile, validLocalMobile } from "@/shared/lib/input-formats";
import { Spacing, Typography } from "@/shared/theme";

interface EmergencyContactItemProps {
  name: string;
  phoneNumber: string;
  relationship?: string;
  profileImage?: string;
}

export function EmergencyContactItem({
  name,
  phoneNumber,
  relationship,
  profileImage,
}: EmergencyContactItemProps) {
  const colors = useTheme();
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [profileImage]);

  const localNumber = localMobile(phoneNumber);
  const displayPhone = validLocalMobile(localNumber) ? formatLocalMobile(localNumber) : phoneNumber;

  return (
    <View style={styles.container}>
      {profileImage && !photoFailed ? (
        <Image source={{ uri: profileImage }} style={styles.avatar} onError={() => setPhotoFailed(true)} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.backgroundSelected }]}>
          <Text style={[Typography.bodyLarge, styles.initial, { color: colors.text }]}>
            {name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

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
          {displayPhone}
        </Text>
        {relationship ? (
          <Text style={[Typography.bodySmall, styles.relationship, { color: colors.textMuted }]} numberOfLines={1}>
            {relationship}
          </Text>
        ) : null}
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

  phone: {
    fontSize: 14,
    marginTop: 2,
  },
  initial: { fontFamily: "Geist-SemiBold" },
  relationship: { marginTop: 2 },
});
