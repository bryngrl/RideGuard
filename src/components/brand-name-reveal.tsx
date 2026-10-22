import { useEffect, useState } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";

import { BrandColors, FontFamily } from "@/shared/theme";

const BRAND_NAME = "ideguard";

type BrandNameRevealProps = {
  delay?: number;
  reveal?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BrandNameReveal({
  delay = 1000,
  reveal = true,
  style,
}: BrandNameRevealProps) {
  const [isVisible, setIsVisible] = useState(!reveal);

  useEffect(() => {
    if (!reveal) return;
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay, reveal]);

  if (!isVisible) return null;

  return (
    <Animated.View
      accessible
      accessibilityLabel={BRAND_NAME}
      style={[styles.wordmark, style]}
    >
      {Array.from(BRAND_NAME).map((letter, index) => (
        <Animated.Text
          key={`${letter}-${index}`}
          entering={
            reveal
              ? FadeIn.duration(360)
                  .delay(index * 95)
                  .easing(Easing.out(Easing.cubic))
              : undefined
          }
          style={styles.letter}
        >
          {letter}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
  },
  letter: {
    color: BrandColors.primary,
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
});
