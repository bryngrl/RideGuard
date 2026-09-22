import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { BrandColors, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface NotificationSheetProps {
  visible: boolean;
  message: string;
  type?: "success" | "error";
  duration?: number;
  onHide?: () => void;
}

export function NotificationSheet({
  visible,
  message,
  type = "success",
  duration = 2500,
  onHide,
}: NotificationSheetProps) {
  const theme = useTheme();

  const translateY = useRef(new Animated.Value(-30)).current;

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) {
    return null;
  }

  const isError = type === "error";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isError ? BrandColors.error : "#EEF4FF",
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text
        style={[
          Typography.bodySmall,
          styles.text,
          {
            color: isError ? "#FFFFFF" : theme.text,
          },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  text: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
  },
});
