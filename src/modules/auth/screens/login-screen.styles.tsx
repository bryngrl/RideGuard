import { StyleSheet } from "react-native";

import {
  BrandColors,
  FontFamily,
  MaxContentWidth,
  Spacing,
  Typography,
} from "@/shared/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },

  heroWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },

  brandNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -15,
    marginTop: 25,
    marginRight: 15,
    zIndex: 1,
  },

  brandNameText: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 34,
    lineHeight: 40,
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },

  cursor: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 32,
    color: BrandColors.accent,
  },

  bottomSection: {
    width: "100%",
    gap: Spacing.four,
  },

  textGroup: {
    gap: Spacing.one,
    alignItems: "center",
  },

  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  buttonGroup: {
    width: "100%",
    paddingTop: Spacing.half,
  },

  legalContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
  },

  legalText: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  legalLink: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});