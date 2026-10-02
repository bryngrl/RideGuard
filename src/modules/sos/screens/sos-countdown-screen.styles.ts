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
    height: 68,
    justifyContent: "center",
    width: 68,
  },

  countdownOuter: {
    alignItems: "center",
    backgroundColor: "#FFE2E5",
    borderRadius: BorderRadius.full,
    height: 78,
    justifyContent: "center",
    width: 78,
  },

  countdownSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  countdownText: {
    color: BrandColors.secondary,
    fontSize: 30,
    lineHeight: 38,
    textAlign: "center",
  },

  description: {
    color: BrandColors.primary,
    lineHeight: 16,
    marginTop: Spacing.three,
    textAlign: "center",
  },

  messageSection: {
    alignItems: "center",
    paddingTop: Spacing.four,
  },

  title: {
    color: BrandColors.primary,
    textAlign: "center",
  },
});
