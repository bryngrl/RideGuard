import { BorderRadius, BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  countdownCircle: {
    alignItems: "center",
    backgroundColor: BrandColors.error,
    borderRadius: BorderRadius.full,
    height: 84,
    justifyContent: "center",
    width: 84,
  },

  countdownOuter: {
    alignItems: "center",
    backgroundColor: "#FFE2E5",
    borderRadius: BorderRadius.full,
    height: 96,
    justifyContent: "center",
    width: 96,
  },

  countdownSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 96,
  },

  countdownText: {
    color: BrandColors.secondary,
    fontSize: 38,
    lineHeight: 46,
    textAlign: "center",
  },

  description: {
    color: BrandColors.primary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.three,
    textAlign: "center",
    maxWidth: 265,
  },
  previewNotice: {
    color: BrandColors.primary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.two,
    textAlign: "center",
  },

  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: 0,
  },

  messageSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },

  title: {
    color: BrandColors.primary,
    fontSize: 28,
    lineHeight: 35,
    textAlign: "center",
  },
});
