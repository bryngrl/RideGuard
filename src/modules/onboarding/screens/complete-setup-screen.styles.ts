import { StyleSheet } from "react-native";
import { Spacing } from "@/shared/theme";

export const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.four },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { textAlign: "center", marginBottom: Spacing.two },
  subtitle: { textAlign: "center", maxWidth: 280 },
  footer: { width: "100%", paddingBottom: Spacing.five },
});
