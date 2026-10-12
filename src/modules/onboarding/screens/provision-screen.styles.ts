import { StyleSheet } from "react-native";
import { Spacing } from "@/shared/theme";

export const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  topSection: { paddingTop: 72 },
  logoContainer: { alignItems: "flex-start", marginBottom: Spacing.three },
  headerContainer: { alignItems: "flex-start", marginBottom: Spacing.five },
  formContainer: { marginTop: Spacing.one },
  footerSection: { marginTop: "auto", paddingTop: Spacing.four },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.three,
  },
  helpTextContainer: { flex: 1 },
  buttonContainer: { width: "100%" },
});
