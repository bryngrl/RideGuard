import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import RideCompleteIcon from "@/assets/icons/modal-icon/success-icon.svg";

import {
  default as MetalDetectionIcon,
  default as MovementMonitoringIcon,
  default as RideDurationIcon,
} from "@/assets/icons/home-icons/icon-for-sheet.svg";

import { LinearGradient } from "expo-linear-gradient";

import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface RideDetailsSheetProps {
  visible: boolean;

  onClose: () => void;

  rideDuration?: string;
  metalDetection?: string;
  movementMonitoring?: string;

  completedAt?: string;
}

interface AnimatedRideInfoCardProps {
  delay: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function AnimatedRideInfoCard({
  delay,
  children,
  style,
}: AnimatedRideInfoCardProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = 80;
    opacity.value = 0;

    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 450,
      }),
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 250,
      }),
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,

      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

export function RideDetailsSheet({
  visible,
  onClose,

  rideDuration = "22 minutes",
  metalDetection = "No metal found",
  movementMonitoring = "Normal",

  completedAt = "Today at 10:30 am",
}: RideDetailsSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/*   BACKDROP   */}

      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        {/*   SHEET   */}

        <Animated.View
          entering={SlideInDown.duration(350)}
          style={styles.sheetWrapper}
        >
          <LinearGradient
            colors={[theme.backgroundElement, "#E8F0FF", "#D6E1F4"]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.sheet}
          >
            {/*   CLOSE BUTTON   */}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close ride details"
            >
              <Text
                style={[
                  styles.closeIcon,
                  {
                    color: theme.text,
                  },
                ]}
              >
                ×
              </Text>
            </Pressable>

            {/*   CONTENT   */}

            <View style={styles.content}>
              {/* SUCCESS ICON */}

              <View style={styles.successIconContainer}>
                <RideCompleteIcon width={96} height={96} />
              </View>

              {/* TITLE */}

              <Text
                style={[
                  Typography.h3,
                  styles.title,
                  {
                    color: BrandColors.primary,
                  },
                ]}
              >
                Ride complete
              </Text>

              {/* DESCRIPTION */}

              <Text
                style={[
                  Typography.caption,
                  styles.description,
                  {
                    color: theme.textMuted,
                  },
                ]}
              >
                Automated safety report for your recent trip.
              </Text>

              {/* DATE */}

              <Text
                style={[
                  Typography.caption,
                  styles.completedAt,
                  {
                    color: theme.textMuted,
                  },
                ]}
              >
                {completedAt}
              </Text>

              {/*   RIDE INFORMATION   */}

              <View style={styles.detailsContainer}>
                {/*   RIDE DURATION   */}

                <AnimatedRideInfoCard
                  delay={350}
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <RideDurationIcon width={20} height={20} />
                  </View>

                  <View style={styles.detailTextContainer}>
                    <Text
                      style={[
                        Typography.caption,
                        styles.detailLabel,
                        {
                          color: theme.textMuted,
                        },
                      ]}
                    >
                      Ride duration
                    </Text>

                    <Text
                      style={[
                        Typography.caption,
                        styles.detailValue,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {rideDuration}
                    </Text>
                  </View>
                </AnimatedRideInfoCard>

                {/*   METAL DETECTION   */}

                <AnimatedRideInfoCard
                  delay={600}
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <MetalDetectionIcon width={20} height={20} />
                  </View>

                  <View style={styles.detailTextContainer}>
                    <Text
                      style={[
                        Typography.caption,
                        styles.detailLabel,
                        {
                          color: theme.textMuted,
                        },
                      ]}
                    >
                      Metal detection
                    </Text>

                    <Text
                      style={[
                        Typography.caption,
                        styles.detailValue,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {metalDetection}
                    </Text>
                  </View>
                </AnimatedRideInfoCard>

                {/*   MOVEMENT MONITORING   */}

                <AnimatedRideInfoCard
                  delay={850}
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                >
                  <View style={styles.detailIcon}>
                    <MovementMonitoringIcon width={20} height={20} />
                  </View>

                  <View style={styles.detailTextContainer}>
                    <Text
                      style={[
                        Typography.caption,
                        styles.detailLabel,
                        {
                          color: theme.textMuted,
                        },
                      ]}
                    >
                      Movement monitoring
                    </Text>

                    <Text
                      style={[
                        Typography.caption,
                        styles.detailValue,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {movementMonitoring}
                    </Text>
                  </View>
                </AnimatedRideInfoCard>
              </View>
            </View>

            {/*   DONE BUTTON   */}

            <View style={styles.footer}>
              <Button
                title="Done"
                variant="primary"
                size="md"
                fullWidth
                onPress={onClose}
                style={styles.doneButton}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },

  sheetWrapper: {
    height: "88%",
    width: "100%",
  },

  sheet: {
    flex: 1,

    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,

    overflow: "hidden",
  },

  closeButton: {
    position: "absolute",

    top: Spacing.three,
    right: Spacing.three,

    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 10,
  },

  closeIcon: {
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },

  content: {
    flex: 1,

    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },

  successIconContainer: {
    width: 110,
    height: 110,

    alignSelf: "center",

    alignItems: "center",
    justifyContent: "center",

    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },

  title: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: Spacing.one,
  },

  description: {
    textAlign: "center",
    marginTop: Spacing.one,
  },

  completedAt: {
    textAlign: "center",
    marginTop: Spacing.two,
  },

  detailsContainer: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },

  detailCard: {
    width: "100%",

    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,

    borderRadius: BorderRadius.md,
  },

  detailIcon: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    marginRight: Spacing.two,
  },

  detailTextContainer: {
    flex: 1,
  },

  detailLabel: {
    lineHeight: 18,
  },

  detailValue: {
    marginTop: 2,
    lineHeight: 18,
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: Spacing.four,

    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
  },

  doneButton: {
    borderRadius: BorderRadius.full,
  },

  pressed: {
    opacity: 0.6,
  },
});
