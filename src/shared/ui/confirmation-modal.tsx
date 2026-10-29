import { useEffect, useRef } from "react";
import { AppState, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "./button";
import { subscribeMpinLock } from "@/modules/mpin/services/mpin-activity";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  primaryButtonColor?: string;
  maxWidth?: number;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
  onRequestClose?: () => void;
}

export function ConfirmationModal({ visible, title, description, primaryButtonText,
  secondaryButtonText, primaryButtonColor, maxWidth = 380, onPrimaryPress, onSecondaryPress,
  onRequestClose }: ConfirmationModalProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const close = useRef(onSecondaryPress);
  close.current = onSecondaryPress;
  useEffect(() => {
    if (!visible) return;
    const unsubscribeLock = subscribeMpinLock(() => close.current());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") close.current();
    });
    return () => { subscription.remove(); unsubscribeLock(); };
  }, [visible]);
  return <Modal transparent animationType={reducedMotion ? "none" : "fade"}
    visible={visible} onRequestClose={onRequestClose ?? onSecondaryPress}>
    <View style={styles.overlay}>
      <View style={[styles.card, { maxWidth, backgroundColor: theme.modalSurface, borderColor: theme.border }]}
        accessibilityViewIsModal>
        <ScrollView bounces={false} style={styles.scroll} contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[Typography.h3, { color: theme.text }]}>{title}</Text>
          {!!description && <Text style={[Typography.body, styles.description, { color: theme.textMuted }]}>{description}</Text>}
        </ScrollView>
        <View style={styles.actions}>
          <Button title={primaryButtonText} onPress={onPrimaryPress}
            textStyle={styles.buttonText}
            style={[styles.button, primaryButtonColor ? { backgroundColor: primaryButtonColor } : undefined]} />
          {secondaryButtonText && <Button title={secondaryButtonText} variant="ghost" onPress={onSecondaryPress}
            textStyle={styles.buttonText} style={styles.button} />}
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center", padding: Spacing.four },
  card: { width: "100%", maxHeight: "85%", borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.four },
  content: { padding: Spacing.two },
  scroll: { flexGrow: 0, flexShrink: 1 },
  description: { marginTop: Spacing.three },
  actions: { flexDirection: "column", gap: Spacing.two, marginTop: Spacing.four },
  button: { width: "100%", minWidth: 0, minHeight: 44 },
  buttonText: { flexShrink: 1, textAlign: "center" },
});
