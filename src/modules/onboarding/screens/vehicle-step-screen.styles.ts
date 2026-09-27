import { StyleSheet } from "react-native";
import { Spacing } from "@/shared/theme";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  stepperContainer: { alignItems: "center", marginBottom: Spacing.five },
  logoContainer: { alignItems: "flex-start", marginBottom: Spacing.three },
  headerContainer: { alignItems: "flex-start", marginBottom: Spacing.four },
  formContainer: {
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: Spacing.three,
  },
});
