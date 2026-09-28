import { Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  logo: {
    height: 60,
    width: 60,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  topSection: {
    flex: 1,
    paddingTop: 72,
  },
});
