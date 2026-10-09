import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type CameraViewMedia = {
  id: string;
  label: string;
  mediaType: "image" | "video";
  source: ImageSourcePropType;
};

export function CameraView({ camera }: { camera: CameraViewMedia }) {
  const liveOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(liveOpacity, {
          toValue: 0.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(liveOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [liveOpacity]);

  return (
    <View style={styles.container}>
      {/* TODO: Render the backend-provided image or video source based on mediaType.
          Protected streams may require backend authentication headers here. */}
      <Image source={camera.source} style={styles.media} resizeMode="cover" />
      <View style={styles.label}>
        <View style={styles.labelRow}>
          {/* TODO: Use backend camera status instead of mock live animation. */}
          <Animated.View style={[styles.labelDot, { opacity: liveOpacity }]} />
          <Text style={[Typography.h3, styles.labelText]}>{camera.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    backgroundColor: "#D9D9D9",
    height: "100%",
    width: "100%",
  },
  label: {
    left: Spacing.two,
    position: "absolute",
    top: Spacing.two,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  labelDot: {
    backgroundColor: BrandColors.error,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  labelText: {
    padding: Spacing.two,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
