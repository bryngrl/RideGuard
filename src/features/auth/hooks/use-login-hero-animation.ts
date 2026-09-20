import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

export function useLoginHeroAnimation(initialTranslateY: number) {
  const logoScale = useSharedValue(2.2);
  const heroTranslateY = useSharedValue(initialTranslateY);

  useEffect(() => {
    logoScale.value = withDelay(
      700,
      withSpring(1, {
        damping: 15,
        stiffness: 75,
      }),
    );

    heroTranslateY.value = withDelay(
      700,
      withSpring(0, {
        damping: 15,
        stiffness: 75,
      }),
    );
  }, [logoScale, heroTranslateY]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: heroTranslateY.value }],
  }));
}
