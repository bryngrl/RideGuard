import { StyleSheet } from "react-native";
import { Spacing } from "@/shared/theme";

export const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 440, alignSelf: "center", paddingTop: Spacing.four, paddingHorizontal: Spacing.five },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: { width: 114, height: 114, marginBottom: Spacing.five + Spacing.two },
  title: { textAlign: "center", fontSize: 26, lineHeight: 32 },
  name: { textAlign: "center", fontSize: 42, lineHeight: 48, marginBottom: Spacing.three },
  subtitle: { textAlign: "center", maxWidth: 280, fontSize: 12, lineHeight: 18 },
  footer: { width: "100%", paddingBottom: Spacing.five },
});
