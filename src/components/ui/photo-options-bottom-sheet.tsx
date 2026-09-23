import React, { useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import CameraIcon from "@/assets/icons/contact-icons/camera-icon.svg";
import ImageIcon from "@/assets/icons/contact-icons/image-icon.svg";

import { Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { GestureHandlerRootView } from "react-native-gesture-handler";

type PhotoOptionsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
};

const SHEET_HEIGHT = 170;
const DISMISS_THRESHOLD = 80;

export function PhotoOptionsBottomSheet({
  visible,
  onClose,
  onTakePhoto,
  onChoosePhoto,
}: PhotoOptionsBottomSheetProps) {
  const theme = useTheme();

  const translateY = useSharedValue(0);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow the sheet to move downward.
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldDismiss =
        translateY.value > DISMISS_THRESHOLD ||
        event.velocityY > 800;

      if (shouldDismiss) {
        translateY.value = withTiming(
          SHEET_HEIGHT,
          {
            duration: 180,
          },
          (finished) => {
            if (finished) {
              runOnJS(closeSheet)();
            }
          },
        );
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 250,
        });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
    ],
  }));

  const handleTakePhoto = () => {
    translateY.value = withTiming(
      SHEET_HEIGHT,
      {
        duration: 180,
      },
      (finished) => {
        if (finished) {
          runOnJS(closeSheet)();
          runOnJS(onTakePhoto)();
        }
      },
    );
  };

  const handleChoosePhoto = () => {
    translateY.value = withTiming(
      SHEET_HEIGHT,
      {
        duration: 180,
      },
      (finished) => {
        if (finished) {
          runOnJS(closeSheet)();
          runOnJS(onChoosePhoto)();
        }
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo options"
        />

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
              },
              animatedSheetStyle,
            ]}
          >
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: theme.textMuted,
                },
              ]}
            />

            <View style={styles.optionsContainer}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
              >
                <CameraIcon width={24} height={24} />

                <Text
                  style={[
                    Typography.body,
                    styles.optionText,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Take photo
                </Text>
              </Pressable>

              <Pressable
                onPress={handleChoosePhoto}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose existing photo"
              >
                <ImageIcon width={24} height={24} />

                <Text
                  style={[
                    Typography.body,
                    styles.optionText,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Choose existing photo
                </Text>
              </Pressable>
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },

  sheet: {
    width: "100%",
    minHeight: SHEET_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 11,
    paddingBottom: 20,
  },

  handle: {
    width: 68,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    opacity: 0.35,
    marginBottom: 40,
  },

  optionsContainer: {
    paddingHorizontal: 56,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    borderRadius: 12,
  },

  optionPressed: {
    opacity: 0.6,
  },

  optionText: {
    marginLeft: 20,
  },
});