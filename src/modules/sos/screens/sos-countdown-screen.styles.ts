import { Colors, FontFamily } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const countdownColors = {
  light: { background: "#DF1014", accent: "#FFFFFF", ring: "#ED5C5F", track: "#B10D10", border: "#B10D10", muted: "#FFFFFF" },
  dark: { background: Colors.dark.background, accent: Colors.dark.error, ring: Colors.dark.dangerStroke, track: Colors.dark.dangerBackground, border: Colors.dark.dangerStroke, muted: Colors.dark.textSecondary },
};

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 28 },
  messageSection: { alignItems: "center", gap: 6 },
  eyebrow: { fontFamily: FontFamily.geistSemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 1, textAlign: "center" },
  title: { color: "#FFFFFF", fontFamily: FontFamily.eloquiaExtraBold, fontSize: 23, lineHeight: 28, textAlign: "center" },
  countdownSection: { flex: 1, alignItems: "center", justifyContent: "center" },
  countdownCircle: { alignItems: "center", justifyContent: "center" },
  countdownValue: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  countdownText: { color: "#FFFFFF", fontFamily: FontFamily.eloquiaExtraBold, fontSize: 80, lineHeight: 88, textAlign: "center", fontVariant: ["tabular-nums"] },
  seconds: { color: "#FFFFFF", fontFamily: FontFamily.geistSemiBold, fontSize: 12, lineHeight: 16 },
  footer: { gap: 22 },
  slider: { height: 56 },
  hint: { fontFamily: FontFamily.geistRegular, fontSize: 11, lineHeight: 15, textAlign: "center" },
});
