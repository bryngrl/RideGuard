import { StyleSheet } from "react-native";

import { BrandColors, FontFamily, Spacing, Typography } from "@/shared/theme";
import { BACK_ARROW_TOUCH_LEFT, BACK_ARROW_TOUCH_SIZE } from "@/shared/ui/back-arrow-icon";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  backButton: { width: BACK_ARROW_TOUCH_SIZE, height: BACK_ARROW_TOUCH_SIZE, marginLeft: BACK_ARROW_TOUCH_LEFT - Spacing.five, alignItems: "center", justifyContent: "center" },
  brand: { alignSelf: "flex-start", marginTop: Spacing.six, marginBottom: Spacing.four },
  introSection: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  formSection: {
    width: "100%",
    flexGrow: 1,
  },
  title: {
    ...Typography.h1,
    color: BrandColors.primary,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.two,
  },
  fields: {
    gap: Spacing.three,
  },
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 46,
  },
  input: {
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  forgotButton: {
    alignSelf: "flex-end",
    paddingVertical: Spacing.one,
  },
  forgotText: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.geistMedium,
    color: BrandColors.accent,
    textDecorationLine: "underline",
  },
  loginButton: {
    height: 42,
    marginTop: Spacing.four,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.geistMedium,
  },
  googleButton: {
    height: 44,
  },
  legalContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
    marginTop: "auto",
    paddingTop: Spacing.four,
  },
  legalText: {
    ...Typography.bodySmall,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  legalLink: {
    ...Typography.bodySmall,
    fontSize: 11,
    lineHeight: 16,
    color: BrandColors.accent,
    textDecorationLine: "underline",
  },
});
