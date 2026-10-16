import { StyleSheet } from "react-native";

import { BrandColors, FontFamily, Spacing, Typography } from "@/shared/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.four,
  },
  topSection: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  heroWrapper: {
    height: 168,
    alignItems: "center",
    justifyContent: "center",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  brandNameContainer: {
    marginLeft: -15,
    marginTop: 25,
  },
  introSection: {
    width: "100%",
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  formSection: {
    width: "100%",
  },
  textGroup: {
    alignItems: "center",
    gap: Spacing.one,
  },
  title: {
    fontFamily: FontFamily.geistSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: BrandColors.primary,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  fields: {
    gap: Spacing.three,
  },
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 44,
  },
  input: {
    paddingVertical: Spacing.two,
    fontSize: 14,
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
  messageBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    marginTop: Spacing.three,
  },
  messageText: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  createButton: {
    alignSelf: "center",
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  createText: {
    ...Typography.button,
    fontSize: 14,
    color: BrandColors.primary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.three,
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
    marginTop: Spacing.three,
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
