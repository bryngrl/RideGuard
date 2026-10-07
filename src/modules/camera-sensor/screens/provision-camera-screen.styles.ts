import { Colors, Typography } from "@/constants/theme";
import { Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  buttonContainer: {
    width: "100%",
  },
  stepperContainer: { alignItems: "center", marginBottom: Spacing.five },

  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  footerSection: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
  },
  formContainer: {
    marginTop: Spacing.one,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
    marginTop: Spacing.three,
  },
  helpContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: Spacing.four,
  },
  helpTextContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: Spacing.three,
    width: 36,
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
  },
  cameraNumber: {
    alignSelf: "flex-start",
    backgroundColor: "#ECF3FF",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 9999,
  },
  cameraNumberText: {
    color: Colors.light.primary,
    ...Typography.medium,
  },
});
