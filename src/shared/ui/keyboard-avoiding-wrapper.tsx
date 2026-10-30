import React, { useContext } from "react";
import { OnboardingProgressContext } from "./onboarding-progress-context";
import Animated, { FadeInRight, useReducedMotion } from "react-native-reanimated";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAwareFormScrollView } from "./keyboard-aware-form-scroll-view";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks";
import { actionFooterPadding, MaxContentWidth, Spacing } from "@/shared/theme";

export interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  enableScrollView?: boolean;
  safeAreaEdges?: Edge[];
}

export function KeyboardAvoidingWrapper({
  children,
  contentContainerStyle,
  style,
  enableScrollView = true,
  safeAreaEdges = ["top", "bottom"],
}: KeyboardAvoidingWrapperProps) {
  const theme = useTheme();
  const managedProgress = useContext(OnboardingProgressContext);
  const reducedMotion = useReducedMotion();
  const { bottom } = useSafeAreaInsets();

  const content = (
    <Animated.View entering={managedProgress && !reducedMotion ? FadeInRight.duration(220) : undefined}
      style={[styles.innerContainer, { paddingBottom: actionFooterPadding(bottom, safeAreaEdges.includes("bottom")) }, contentContainerStyle]}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }, style]}
      edges={managedProgress ? safeAreaEdges.filter((edge) => edge !== "top") : safeAreaEdges}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {enableScrollView ? (
          <KeyboardAwareFormScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            keyboardGap={Spacing.four}
          >
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              {content}
            </TouchableWithoutFeedback>
          </KeyboardAwareFormScrollView>
        ) : (
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            {content}
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  innerContainer: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
  },
});
