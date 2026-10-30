import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AppModal as Modal } from "./app-modal";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CameraIcon from "@/assets/icons/contacts/camera.svg";
import ImageIcon from "@/assets/icons/contacts/image.svg";
import { useTheme } from "@/shared/hooks";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { FeedbackPressable } from "@/shared/ui/feedback-pressable";

type PhotoAction = "camera" | "gallery";

type PhotoOptionsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
};

export function PhotoOptionsBottomSheet({
  visible,
  onClose,
  onTakePhoto,
  onChoosePhoto,
}: PhotoOptionsBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const closingRef = useRef(false);
  const openedRef = useRef(false);
  const pendingActionRef = useRef<PhotoAction | null>(null);
  const callbacksRef = useRef({ onClose, onTakePhoto, onChoosePhoto });
  callbacksRef.current = { onClose, onTakePhoto, onChoosePhoto };

  const backdropOpacity = useSharedValue(0);
  const sheetY = useSharedValue(screenHeight);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));

  const finishClose = useCallback(() => {
    openedRef.current = false;
    setMounted(false);
    callbacksRef.current.onClose();
  }, []);

  const close = useCallback((action?: PhotoAction) => {
    if (closingRef.current || !mounted) return;
    closingRef.current = true;
    pendingActionRef.current = action ?? null;
    backdropOpacity.value = withTiming(0, { duration: reducedMotion ? 0 : 150 });
    sheetY.value = withTiming(sheetHeight || screenHeight, { duration: reducedMotion ? 0 : 200 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [backdropOpacity, finishClose, mounted, reducedMotion, screenHeight, sheetHeight, sheetY]);

  useEffect(() => {
    if (visible && !mounted && !closingRef.current) setMounted(true);
    if (!visible && mounted && !closingRef.current) close();
    if (!visible && !mounted) closingRef.current = false;
  }, [close, mounted, visible]);

  useEffect(() => {
    if (!visible || !mounted || !sheetHeight || closingRef.current || openedRef.current) return;
    openedRef.current = true;
    backdropOpacity.value = 0;
    sheetY.value = sheetHeight;
    const frame = requestAnimationFrame(() => {
      backdropOpacity.value = withTiming(1, { duration: reducedMotion ? 0 : 140 });
      sheetY.value = withTiming(0, { duration: reducedMotion ? 0 : 260 });
    });
    return () => cancelAnimationFrame(frame);
  }, [backdropOpacity, mounted, reducedMotion, sheetHeight, sheetY, visible]);

  useEffect(() => {
    if (mounted || !pendingActionRef.current) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    const frame = requestAnimationFrame(() => {
      if (action === "camera") callbacksRef.current.onTakePhoto();
      else callbacksRef.current.onChoosePhoto();
    });
    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && mounted) close();
    });
    return () => subscription.remove();
  }, [close, mounted]);

  const gesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      sheetY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 800) {
        runOnJS(close)();
      } else {
        sheetY.value = withTiming(0, { duration: reducedMotion ? 0 : 180 });
      }
    });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => close()}
    >
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, { backgroundColor: theme.overlay }, backdropStyle]} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          accessibilityRole="button"
          accessibilityLabel="Close photo options"
        />
        <GestureDetector gesture={gesture}>
          <Animated.View
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              { backgroundColor: theme.modalSurface, paddingBottom: Spacing.three + insets.bottom },
              sheetStyle,
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.textMuted }]} />
            <View style={styles.optionsContainer}>
              <FeedbackPressable
                onPress={() => close("camera")}
                style={styles.option}
                feedbackRadius={BorderRadius.md}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
              >
                <CameraIcon color={theme.icon} width={24} height={24} />
                <Text style={[Typography.button, styles.optionText, { color: theme.text }]}>Take photo</Text>
              </FeedbackPressable>
              <FeedbackPressable
                onPress={() => close("gallery")}
                style={styles.option}
                feedbackRadius={BorderRadius.md}
                accessibilityRole="button"
                accessibilityLabel="Choose existing photo"
              >
                <ImageIcon color={theme.icon} width={24} height={24} />
                <Text style={[Typography.button, styles.optionText, { color: theme.text }]}>Choose existing photo</Text>
              </FeedbackPressable>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.three,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
    opacity: 0.35,
    marginBottom: Spacing.two,
  },
  optionsContainer: {
    paddingHorizontal: Spacing.four,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  optionText: {
    marginLeft: Spacing.three,
  },
});
