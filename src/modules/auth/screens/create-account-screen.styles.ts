import { StyleSheet } from "react-native";

import { BrandColors, FontFamily, Spacing, Typography } from "@/shared/theme";
import { BACK_ARROW_TOUCH_LEFT, BACK_ARROW_TOUCH_SIZE } from "@/shared/ui/back-arrow-icon";

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
  backButton: { width: BACK_ARROW_TOUCH_SIZE, height: BACK_ARROW_TOUCH_SIZE, marginLeft: BACK_ARROW_TOUCH_LEFT - Spacing.five, alignItems: "center", justifyContent: "center" },
  brand: {
    alignSelf: "flex-start",
    marginTop: Spacing.six,
    marginBottom: Spacing.four,
  },
  heading: {
    ...Typography.h1,
    color: BrandColors.primary,
  },
  description: {
    ...Typography.bodySmall,
    marginTop: Spacing.two,
  },
  fields: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  feedback: { marginTop: Spacing.four },
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 46,
  },
  submitButton: {
    height: 42,
    marginTop: Spacing.five,
  },
  loginLink: {
    alignSelf: "center",
    flexDirection: "row",
    paddingVertical: Spacing.two,
    marginTop: Spacing.three,
  },
  loginText: {
    ...Typography.bodySmall,
  },
  loginAction: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.geistSemiBold,
  },
});
