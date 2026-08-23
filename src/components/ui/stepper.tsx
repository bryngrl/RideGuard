import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Colors, Spacing, Typography } from "@/constants/theme";

interface StepperProps {
  steps?: number;
  currentStep: number;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>; 
}

interface StepItemProps {
  stepNumber: number;
  isCompleted: boolean;
  isActive: boolean;
  isLastStep: boolean;
  size: number;
}

const StepItem = ({
  stepNumber,
  isCompleted,
  isActive,
  isLastStep,
  size,
}: StepItemProps) => {
  const circleAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isCompleted || isActive ? Colors.light.primary : Colors.light.border,
        { duration: 300 },
      ),
    };
  });

  const lineAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isCompleted ? "100%" : "0%", { duration: 400 }),
    };
  });

  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isCompleted ? 1 : 0, { duration: 200 }),
      transform: [{ scale: withSpring(isCompleted ? 1 : 0) }],
    };
  });

  const numberAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isCompleted ? 0 : 1, { duration: 200 }),
      transform: [
        { scale: withTiming(isCompleted ? 0.5 : 1, { duration: 200 }) },
      ],
    };
  });

  const dynamicStyles = {
    circle: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    straightCheck: {
      width: size * 0.28,
      height: size * 0.5,
      borderBottomWidth: size * 0.07,
      borderRightWidth: size * 0.07,
      marginTop: -(size * 0.1),
      marginLeft: size * 0.05,
    },
    stepText: {
      fontSize: size * 0.45,
    },
  };

  return (
    <View style={[styles.stepContainer, { flex: isLastStep ? 0 : 1 }]}>
      <View style={styles.stepWrapper}>
        <Animated.View
          style={[styles.circle, dynamicStyles.circle, circleAnimatedStyle]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.centerContent,
              numberAnimatedStyle,
            ]}
          >
            <Text
              style={[
                styles.stepNumberText,
                dynamicStyles.stepText,
                isActive && styles.activeStepNumberText,
              ]}
            >
              {stepNumber}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.centerContent,
              checkmarkAnimatedStyle,
            ]}
          >
            <View style={[styles.straightCheck, dynamicStyles.straightCheck]} />
          </Animated.View>
        </Animated.View>
      </View>

      {!isLastStep && (
        <View style={styles.lineBackground}>
          <Animated.View style={[styles.lineFill, lineAnimatedStyle]} />
        </View>
      )}
    </View>
  );
};

const Stepper = ({
  steps = 3,
  currentStep,
  size = 36,
  containerStyle,
}: StepperProps) => {
  const stepArray = Array.from({ length: steps }, (_, i) => i + 1);

  return (
    <View style={[styles.container, containerStyle]}>
      {stepArray.map((stepNumber, index) => (
        <StepItem
          key={stepNumber}
          stepNumber={stepNumber}
          isCompleted={currentStep > stepNumber}
          isActive={currentStep === stepNumber}
          isLastStep={index === stepArray.length - 1}
          size={size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.four,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepWrapper: {
    alignItems: "center",
    zIndex: 2,
  },
  circle: {
    overflow: "hidden",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  straightCheck: {
    borderColor: Colors.light.textInverse,
    transform: [{ rotate: "45deg" }],
  },
  stepNumberText: {
    fontFamily: Typography.bodyLarge.fontFamily,
    color: Colors.light.textMuted,
  },
  activeStepNumberText: {
    color: Colors.light.textInverse,
  },
  lineBackground: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.light.border,
    marginHorizontal: -Spacing.one,
    zIndex: 1,
  },
  lineFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },
});

export default Stepper;
