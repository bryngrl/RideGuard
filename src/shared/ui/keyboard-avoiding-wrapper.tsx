import React from "react";
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
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks";
import { MaxContentWidth, Spacing } from "@/shared/theme";

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

  const content = (
    <View style={[styles.innerContainer, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }, style]}
      edges={safeAreaEdges}
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
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={20}
            extraHeight={100}
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
