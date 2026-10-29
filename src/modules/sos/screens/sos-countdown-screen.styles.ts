import { Colors, FontFamily, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const countdownColors = {
  light: { background: Colors.light.background, accent: Colors.light.sosSurface, onAccent: Colors.light.sosOnSurface,
    ring: Colors.light.sosSoftSurface, track: Colors.light.sosSoftSurface, border: Colors.light.sosSurface,
    divider: Colors.light.border, heading: Colors.light.text, muted: Colors.light.text },
  dark: { background: Colors.dark.background, accent: Colors.dark.error, onAccent: Colors.dark.textInverse,
    ring: Colors.dark.sosSoftSurface, track: Colors.dark.sosSoftSurface, border: Colors.dark.error,
    divider: Colors.dark.border, heading: Colors.dark.text, muted: Colors.dark.textSecondary },
};

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 56, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontFamily: FontFamily.geistMedium, fontSize: 16, lineHeight: 22, textAlign: "center" },
  content: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.five },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1 },
  messageSection: { alignItems: "center", gap: Spacing.three },
  title: { fontFamily: FontFamily.eloquiaExtraBold, fontSize: 28, lineHeight: 34, textAlign: "center" },
  description: { fontFamily: FontFamily.geistRegular, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 300 },
  countdownSection: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 180, paddingBottom: Spacing.four },
  countdownCircle: { alignItems: "center", justifyContent: "center" },
  countdownValue: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  countdownText: { fontFamily: FontFamily.eloquiaExtraBold, fontSize: 40, lineHeight: 48, textAlign: "center", fontVariant: ["tabular-nums"] },
  seconds: { fontFamily: FontFamily.geistMedium, fontSize: 11, lineHeight: 16 },
  footer: { gap: Spacing.three },
  slider: { height: 60 },
  hint: { fontFamily: FontFamily.geistRegular, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
