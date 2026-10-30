import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppState, BackHandler, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLockup } from "@/components/brand-lockup";
import { BrandLoading } from "@/shared/ui/brand-loading";
import { useTheme } from "@/shared/hooks/use-theme";
import { actionFooterPadding, BorderRadius, PinLayout, Spacing, Typography, getPinKeypadGap } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { PinPad } from "@/shared/ui/pin-pad";

interface MpinUnlockExperienceProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  onForgot: () => void;
  onExit?: () => void;
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
export function MpinUnlockExperience({ value, onChange, onComplete, onForgot, onExit,
  isPending, initialEntry = false, disabled = false, busy = false, error, errorVersion = 0, preview = false, footer }: MpinUnlockExperienceProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [entry, setEntry] = useState(initialEntry);
  const [panelHeight, setPanelHeight] = useState(0);
  const [feedbackHeight, setFeedbackHeight] = useState(0);
  const progress = useSharedValue(initialEntry ? 1 : 0);
  const arrival = useSharedValue(initialEntry || reducedMotion ? 1 : 0);
  const feedbackLift = useSharedValue(0);
  const contentHeight = Math.max(0, height - insets.top - insets.bottom);
  const compact = contentHeight < 740;
  const keypadGap = compact ? Spacing.four : getPinKeypadGap(contentHeight);
  const keyHeight = compact ? 44 : PinLayout.keyHeight;
  const indicatorHeight = compact ? 44 : PinLayout.indicatorHeight;
  const panelBottom = actionFooterPadding(insets.bottom, true);
  const estimatedPanelHeight = indicatorHeight + Spacing.four * 2 + keypadGap +
    keyHeight * 4 + PinLayout.rowGap * 3 + PinLayout.actionGap + 40;
  const panelTop = Math.max(0, contentHeight - (panelHeight || estimatedPanelHeight) - panelBottom);
  const logoTop = Math.max(Spacing.four, Math.min(contentHeight * 0.26, panelTop - 78));
  const cardTop = Math.max(0, Math.min(contentHeight - 180, Math.max(logoTop + 220, contentHeight * 0.64)));
  const splashOffset = (height - insets.top - insets.bottom) / 2 - 32 - logoTop;

  useEffect(() => {
    arrival.value = withTiming(1, { duration: reducedMotion ? 0 : 650, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(arrival);
  }, [arrival, reducedMotion]);

  useEffect(() => {
    progress.value = withTiming(entry ? 1 : 0, { duration: reducedMotion ? 0 : 460, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [entry, progress, reducedMotion]);

  useEffect(() => {
    // Feedback grows upwards; only the brand makes room. PIN/keypad/actions
    // keep their bottom anchor and never acquire a scroll offset.
    const lift = error || busy ? Math.min(feedbackHeight, Math.max(0, logoTop - Spacing.three)) : 0;
    feedbackLift.value = withTiming(lift, { duration: reducedMotion ? 0 : 180 });
    return () => cancelAnimation(feedbackLift);
  }, [error, busy, feedbackHeight, logoTop, reducedMotion, feedbackLift]);

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

  const brandMotion = useAnimatedStyle(() => ({ transform: [{ translateY: splashOffset * (1 - arrival.value) - (8 + feedbackLift.value) * progress.value }] }));
  const cardMotion = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * arrival.value, transform: [{ translateY: -10 * progress.value }] }));
  const panelMotion = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: 16 * (1 - progress.value) }] }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View collapsable={false} style={styles.content}>
        <View collapsable={false} style={[styles.lock, compact && styles.compactLock]} accessible accessibilityLabel="App locked">
          <Ionicons name="lock-closed" size={26} color={theme.switchOff} />
        </View>
        <Animated.View collapsable={false} style={[styles.brand, { top: logoTop }, brandMotion]}><BrandLockup /></Animated.View>
        <Animated.View collapsable={false} pointerEvents={entry ? "none" : "auto"} accessibilityElementsHidden={entry}
          importantForAccessibility={entry ? "no-hide-descendants" : "auto"}
          style={[styles.cardPosition, { top: cardTop }, cardMotion]}>
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
        <Animated.View collapsable={false} pointerEvents={entry ? "auto" : "none"} accessibilityElementsHidden={!entry}
          importantForAccessibility={entry ? "auto" : "no-hide-descendants"}
          style={[styles.panel, { bottom: panelBottom }, panelMotion]}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}>
          <Text accessibilityRole="header" style={styles.accessibleHeading}>Enter your MPIN</Text>
          <View collapsable={false} style={styles.feedback}
            onLayout={(event) => setFeedbackHeight(event.nativeEvent.layout.height)}>
            {error && <FormFeedback message={error} />}
            {busy && <View style={styles.busy} accessibilityLiveRegion="polite" accessible accessibilityLabel="Verifying MPIN">
              <BrandLoading size={24} label="Verifying MPIN" />
            </View>}
          </View>
          <PinPad value={value} onChange={onChange} onComplete={onComplete} disabled={disabled || busy || !entry}
            error={!!error} errorVersion={errorVersion} indicatorStyle={{ height: indicatorHeight }}
            keyStyle={{ minHeight: keyHeight }} keypadStyle={{ marginTop: keypadGap }} />
          <Button title="Forgot MPIN?" variant="ghost" onPress={onForgot} disabled={busy} style={styles.forgot} />
          {preview && <Text style={[styles.preview, { color: theme.textMuted }]}>Design preview only. No MPIN will be verified.</Text>}
          <View style={footer ? styles.footer : undefined}>{footer}</View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, width: "100%", maxWidth: 440, alignSelf: "center", paddingHorizontal: Spacing.five },
  lock: { position: "absolute", top: 42, left: 0, right: 0, alignItems: "center" },
  compactLock: { top: Spacing.two, alignItems: "flex-end" },
  brand: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  cardPosition: { position: "absolute", left: Spacing.five, right: Spacing.five, alignItems: "center" },
  card: { width: 112, minHeight: 142, borderWidth: 1, borderRadius: BorderRadius.lg, alignItems: "center", justifyContent: "center", gap: Spacing.four, padding: Spacing.three },
  grid: { gap: Spacing.two },
  gridRow: { flexDirection: "row", gap: Spacing.two },
  gridDot: { width: 9, height: 9, borderWidth: 2, borderRadius: BorderRadius.full },
  panel: { position: "absolute", left: Spacing.five, right: Spacing.five },
  accessibleHeading: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
  busy: { alignItems: "center" },
  feedback: { position: "absolute", bottom: "100%", left: 0, right: 0, paddingBottom: Spacing.two },
  forgot: { marginTop: PinLayout.actionGap },
  preview: { ...Typography.caption, textAlign: "center", marginTop: Spacing.three },
  footer: { gap: Spacing.two, marginTop: Spacing.three },
  landingFooter: { alignSelf: "stretch", gap: Spacing.two, marginTop: Spacing.three },
});
