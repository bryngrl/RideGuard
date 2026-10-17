import { StyleSheet } from "react-native";

import { BrandColors, FontFamily, Spacing, Typography } from "@/shared/theme";

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
  backButton: { width: 44, height: 48, marginLeft: -Spacing.two, alignItems: "flex-start", justifyContent: "center" },
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
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 44,
  },
  submitButton: {
    height: 42,
    marginTop: Spacing.five,
  },
  messageBox: {
    borderRadius: 10,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  messageText: {
    ...Typography.bodySmall,
    textAlign: "center",
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
