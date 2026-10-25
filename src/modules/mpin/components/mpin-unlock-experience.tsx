import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, BackHandler, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLockup } from "@/components/brand-lockup";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, PinLayout, Spacing, Typography } from "@/shared/theme";
import { BACK_ARROW_TOUCH_LEFT, BACK_ARROW_TOUCH_SIZE, BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { PinPad } from "@/shared/ui/pin-pad";

interface MpinUnlockExperienceProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  onForgot: () => void;
  onExit?: () => void;
  onCheckStatus?: () => void;
  isPending: () => boolean;
  initialEntry?: boolean;
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
  errorVersion?: number;
  preview?: boolean;
  footer?: ReactNode;
}

/** Both mockup screens share one mounted logo, avoiding a size jump on entry. */
export function MpinUnlockExperience({ value, onChange, onComplete, onForgot, onExit, onCheckStatus,
  isPending, initialEntry = false, disabled = false, busy = false, error, errorVersion = 0, preview = false, footer }: MpinUnlockExperienceProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [entry, setEntry] = useState(initialEntry);
  const [panelHeight, setPanelHeight] = useState(0);
  const [cardHeight, setCardHeight] = useState(142);
  const progress = useSharedValue(initialEntry ? 1 : 0);
  const arrival = useSharedValue(initialEntry || reducedMotion ? 1 : 0);
  const contentHeight = Math.max(PinLayout.minimumContentHeight, height - insets.top - insets.bottom);
  const logoTop = Math.max(148, Math.min(contentHeight * 0.26, 224));
  const panelTop = logoTop + 78;
  const cardTop = Math.max(logoTop + 220, contentHeight * 0.64);
  const splashOffset = (height - insets.top - insets.bottom) / 2 - 32 - logoTop;

  useEffect(() => {
    arrival.value = withTiming(1, { duration: reducedMotion ? 0 : 650, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(arrival);
  }, [arrival, reducedMotion]);

  useEffect(() => {
    progress.value = withTiming(entry ? 1 : 0, { duration: reducedMotion ? 0 : 460, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [entry, progress, reducedMotion]);

  // Return to the first mockup after a real background visit, without replaying
  // the letter reveal or retaining a partially entered PIN.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        setEntry(false);
        progress.value = 0;
      }
    });
    return () => subscription.remove();
  }, [progress]);

  const closeEntry = useCallback(() => {
    if (isPending()) return;
    if (entry) { onChange(""); setEntry(false); }
    else onExit?.();
  }, [entry, isPending, onChange, onExit]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeEntry();
      return true;
    });
    return () => subscription.remove();
  }, [closeEntry]));

  const brandMotion = useAnimatedStyle(() => ({ transform: [{ translateY: splashOffset * (1 - arrival.value) - 8 * progress.value }] }));
  const cardMotion = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * arrival.value, transform: [{ translateY: -10 * progress.value }] }));
  const panelMotion = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: 16 * (1 - progress.value) }] }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, {
        minHeight: Math.max(contentHeight, entry ? panelTop + panelHeight + Spacing.four : cardTop + cardHeight + Spacing.four),
      }]} showsVerticalScrollIndicator={false}>
        {(entry || onExit) && <Pressable onPress={closeEntry} disabled={busy} accessibilityRole="button"
          feedbackRadius={16} feedbackInsets={Spacing.two} feedbackBehindContent
          accessibilityLabel={entry ? "Back to app unlock" : "Back to MPIN settings"}
          style={styles.back}><BackArrowIcon color={theme.text} /></Pressable>}
        <View style={styles.lock} accessible accessibilityLabel="App locked">
          <Ionicons name="lock-closed" size={26} color={theme.switchOff} />
        </View>
        <Animated.View style={[styles.brand, { top: logoTop }, brandMotion]}><BrandLockup /></Animated.View>
        <Animated.View pointerEvents={entry ? "none" : "auto"} accessibilityElementsHidden={entry}
          importantForAccessibility={entry ? "no-hide-descendants" : "auto"}
          style={[styles.cardPosition, { top: cardTop }, cardMotion]}
          onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}>
          <Pressable accessibilityRole="button" accessibilityLabel="Unlock RideGuard" accessibilityHint="Opens the four-digit MPIN keypad"
            onPress={() => { if (!entry) setEntry(true); }}
            feedbackRadius={BorderRadius.lg}
            style={[styles.card, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <View style={styles.grid} importantForAccessibility="no-hide-descendants">
              {[0, 1, 2].map((row) => <View key={row} style={styles.gridRow}>
                {[0, 1, 2].map((column) => <View key={column} style={[styles.gridDot, { borderColor: theme.text }]} />)}
              </View>)}
            </View>
            <Text style={[Typography.button, { color: theme.text }]}>Unlock RideGuard</Text>
          </Pressable>
          {!entry && <View style={styles.landingFooter}>
            {preview && <Text style={[styles.preview, { color: theme.textMuted }]}>Design preview only</Text>}
            {footer}
          </View>}
        </Animated.View>
        <Animated.View pointerEvents={entry ? "auto" : "none"} accessibilityElementsHidden={!entry}
          importantForAccessibility={entry ? "auto" : "no-hide-descendants"}
          style={[styles.panel, { top: panelTop }, panelMotion]}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}>
          <Text accessibilityRole="header" style={styles.accessibleHeading}>Enter your MPIN</Text>
          <PinPad value={value} onChange={onChange} onComplete={onComplete} disabled={disabled || busy || !entry}
            error={!!error} errorVersion={errorVersion} />
          {busy && <View style={styles.busy} accessibilityLiveRegion="polite" accessible accessibilityLabel="Verifying MPIN">
            <ActivityIndicator color={theme.text} />
          </View>}
          {error && <View style={styles.feedback}><FormFeedback message={error} /></View>}
          <Button title="Forgot MPIN?" variant="ghost" onPress={onForgot} disabled={busy} style={styles.forgot} />
          {onCheckStatus && <Button title="Check MPIN status" variant="ghost" onPress={onCheckStatus} disabled={busy} />}
          {preview && <Text style={[styles.preview, { color: theme.textMuted }]}>Design preview only. No MPIN will be verified.</Text>}
          <View style={styles.footer}>{footer}</View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: "100%", maxWidth: 440, alignSelf: "center", paddingHorizontal: Spacing.five },
  back: { position: "absolute", left: BACK_ARROW_TOUCH_LEFT, top: Spacing.two, width: BACK_ARROW_TOUCH_SIZE, height: BACK_ARROW_TOUCH_SIZE, alignItems: "center", justifyContent: "center", zIndex: 2 },
  lock: { position: "absolute", top: 42, left: 0, right: 0, alignItems: "center" },
  brand: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  cardPosition: { position: "absolute", left: Spacing.five, right: Spacing.five, alignItems: "center" },
  card: { width: 112, minHeight: 142, borderWidth: 1, borderRadius: BorderRadius.lg, alignItems: "center", justifyContent: "center", gap: Spacing.four, padding: Spacing.three },
  grid: { gap: Spacing.two },
  gridRow: { flexDirection: "row", gap: Spacing.two },
  gridDot: { width: 9, height: 9, borderWidth: 2, borderRadius: BorderRadius.full },
  panel: { position: "absolute", left: Spacing.five, right: Spacing.five },
  accessibleHeading: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
  busy: { alignItems: "center", marginTop: Spacing.two },
  feedback: { marginTop: Spacing.three },
  forgot: { marginTop: PinLayout.actionGap },
  preview: { ...Typography.caption, textAlign: "center", marginTop: Spacing.three },
  footer: { gap: Spacing.two, marginTop: Spacing.three },
  landingFooter: { alignSelf: "stretch", gap: Spacing.two, marginTop: Spacing.three },
});
