import { useEffect, useRef } from "react";
import { Spacing } from "@/shared/theme";
import { Animated, Easing, StyleSheet, View } from "react-native";

export function ButtonTestLoader({ color }: { color: string }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        ...dots.flatMap((dot) => [
          Animated.timing(dot, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(180),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [dots]);

  return (
    <View style={styles.dots}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -7],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  dot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
});
