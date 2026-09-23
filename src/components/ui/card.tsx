import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type CardSize = "small" | "large";
export type ConnectionState = "connected" | "disconnected";

export interface CardProps {
  size: CardSize;
  title: string;
  icon?: React.ReactNode;
  connectionState?: ConnectionState;
  connectedIcon?: React.ReactNode;
  disconnectedIcon?: React.ReactNode;
  subtitle?: string;
  status?: string;
  statusIcon?: React.ReactNode;
  connectedStatusIcon?: React.ReactNode;
  disconnectedStatusIcon?: React.ReactNode;

  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}
export function Card({
  size,
  title,
  icon,
  connectionState,
  connectedIcon,
  disconnectedIcon,
  subtitle,
  status,
  statusIcon,
  connectedStatusIcon,
  disconnectedStatusIcon,
  onPress,
  style,
}: CardProps) {
  const colors = useTheme();
  const isLarge = size === "large";

  const displayIcon =
    connectionState === "connected"
      ? (connectedIcon ?? icon)
      : connectionState === "disconnected"
        ? (disconnectedIcon ?? icon)
        : icon;

  const displayStatusIcon =
    connectionState === "connected"
      ? (connectedStatusIcon ?? statusIcon)
      : connectionState === "disconnected"
        ? (disconnectedStatusIcon ?? statusIcon)
        : statusIcon;

  const statusDotColor =
    connectionState === "disconnected" ? colors.textInactive : colors.success;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isLarge ? styles.largeCard : styles.smallCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && onPress && styles.pressed,
        style,
      ]}
    >
      {/* ICON */}
      <View
        style={[
          styles.iconContainer,
          isLarge ? styles.largeIconContainer : styles.smallIconContainer,
          !isLarge && {
            backgroundColor: colors.backgroundSelected,
          },
        ]}
      >
        {displayIcon}
      </View>

      {/* TEXT CONTENT */}
      <View style={styles.copy}>
        {/* TITLE */}
        <Text
          style={[
            isLarge ? Typography.bodyLarge : Typography.bodySmall,
            styles.title,
            { color: colors.text },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* SUBTITLE */}
        {subtitle ? (
          <Text
            style={[
              isLarge
                ? Typography.bodySmall
                : [Typography.bodySmall, styles.smallSubtitle],
              styles.subtitle,
              { color: colors.textMuted },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* STATUS */}
        {status ? (
          <View style={styles.statusRow}>
            {displayStatusIcon ?? (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: statusDotColor,
                  },
                ]}
              />
            )}

            <Text
              style={[
                isLarge
                  ? Typography.bodySmall
                  : [Typography.bodySmall, styles.smallStatusText],
                styles.statusText,
                { color: colors.textMuted },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {status}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },

  largeCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    gap: Spacing.two,
  },

  smallCard: {
    minHeight: 82,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.two,
    gap: Spacing.two,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },

  largeIconContainer: {
    width: 48,
    height: 48,
  },

  smallIconContainer: {
    width: 32,
    height: 32,
  },

  copy: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    flexShrink: 1,
  },

  subtitle: {
    marginTop: Spacing.half,
    flexShrink: 1,
  },
  smallSubtitle: {
    fontSize: 10,
    lineHeight: 12,
  },
  smallStatusText: {
    fontSize: 9,
    lineHeight: 11,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.one,
    gap: Spacing.two,
    minWidth: 0,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },

  statusText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
