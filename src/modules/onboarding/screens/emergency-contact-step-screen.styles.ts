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
    marginTop: "auto",
    paddingTop: Spacing.two,
  },
  relationshipDropdown: {
    position: "relative",
    zIndex: 10,
    paddingBottom: Spacing.two,
  },
  dropdownMenu: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    marginTop: -Spacing.one,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
