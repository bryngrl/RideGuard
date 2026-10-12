import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useTheme } from "@/shared/hooks";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";

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

  backgroundColor?: string;
  borderColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  iconBackgroundColor?: string;

  actionTitle?: string;
  onActionPress?: () => void;

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
  backgroundColor,
  borderColor,
  titleColor,
  subtitleColor,
  iconBackgroundColor,
  actionTitle,
  onActionPress,
  onPress,
  style,
}: CardProps) {
  const colors = useTheme();
  const isLarge = size === "large";
  const hasAction = isLarge && Boolean(actionTitle && onActionPress);

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
          backgroundColor: backgroundColor ?? colors.card,
          borderColor: borderColor ?? colors.border,
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
          isLarge &&
            iconBackgroundColor && {
              backgroundColor: iconBackgroundColor,
            },
        ]}
      >
        {displayIcon}
      </View>

      {/* TEXT CONTENT */}
      <View style={[styles.copy, hasAction && styles.largeCopyWithAction]}>
        {/* TITLE */}
        <Text
          style={[
            isLarge ? Typography.bodyLarge : Typography.bodySmall,
            styles.title,
            { color: titleColor ?? colors.text },
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
              { color: subtitleColor ?? colors.textMuted },
            ]}
            numberOfLines={isLarge ? 3 : 1}
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

        {/* ACTION */}
        {hasAction ? (
          <Button
            title={actionTitle ?? ""}
            variant="outline"
            size="sm"
            onPress={onActionPress}
            style={styles.actionButton}
          />
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

  largeCopyWithAction: {
    alignSelf: "stretch",
    justifyContent: "center",
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

  actionButton: {
    marginTop: Spacing.two,
    width: 90,
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
