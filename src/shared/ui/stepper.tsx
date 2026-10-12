import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Colors, Spacing } from "@/shared/theme";

interface StepperProps {
  /**
   * Total number of steps.
   * The page/flow controls this value.
   */
  steps?: number;

  /**
   * Current step, starting at 1.
   */
  currentStep: number;

  /**
   * Height of each progress segment.
   */
  size?: number;

  containerStyle?: StyleProp<ViewStyle>;
}

interface StepItemProps {
  isCompleted: boolean;
  isLastStep: boolean;
  size: number;
}

const StepItem = ({ isCompleted, isLastStep, size }: StepItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isCompleted ? "rgba(26, 43, 76, 0.8)" : Colors.light.border,
        {
          duration: 300,
        },
      ),
    };
  });

  return (
    <View style={[styles.stepContainer, !isLastStep && styles.stepSpacing]}>
      <Animated.View
        style={[
          styles.segment,
          {
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const Stepper = ({
  steps = 3,
  currentStep,
  size = 6,
  containerStyle,
}: StepperProps) => {
  const safeSteps = Math.max(1, Math.floor(steps));

  const safeCurrentStep = Math.min(
    Math.max(1, Math.floor(currentStep)),
    safeSteps,
  );

  const stepArray = Array.from({ length: safeSteps }, (_, index) => index + 1);

  return (
    <View style={[styles.container, containerStyle]}>
      {stepArray.map((stepNumber) => (
        <StepItem
          key={stepNumber}
          isCompleted={stepNumber <= safeCurrentStep}
          isLastStep={stepNumber === safeSteps}
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
    width: "100%",
    paddingVertical: Spacing.one,
    paddingBottom: Spacing.five,
  },

  stepContainer: {
    flex: 1,
  },

  stepSpacing: {
    marginRight: Spacing.one,
  },

  segment: {
    width: "100%",
  },
});

export default Stepper;
