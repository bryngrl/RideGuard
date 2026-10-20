import { StyleSheet } from "react-native";

import { FontFamily, Spacing, Typography } from "@/shared/theme";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  backButton: {
    width: 44,
    height: 48,
    marginLeft: -Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    marginTop: Spacing.four,
  },
  heading: {
    ...Typography.h3,
    textAlign: "center",
  },
  description: {
    ...Typography.bodySmall,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 260,
    marginTop: Spacing.four,
  },
  feedback: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.three,
  },
  confirmButton: {
    marginTop: Spacing.four,
    height: 41,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.three,
  },
  resendPrompt: {
    ...Typography.bodySmall,
  },
  resendLink: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.geistMedium,
  },
});
