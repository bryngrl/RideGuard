import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  enableScrollView?: boolean;
}

export function KeyboardAvoidingWrapper({
  children,
  contentContainerStyle,
  style,
  enableScrollView = true,
}: KeyboardAvoidingWrapperProps) {
  const theme = useTheme();

  const content = (
    <View style={[styles.innerContainer, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }, style]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {enableScrollView ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </TouchableWithoutFeedback>
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
    width: "100%",
    maxWidth: MaxContentWidth,
    flex: 1,

    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
});
