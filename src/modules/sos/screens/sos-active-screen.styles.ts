import { BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingBottom: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },

  description: {
    color: BrandColors.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.three,
    textAlign: "center",
    maxWidth: 265,
  },
  previewNotice: {
    color: BrandColors.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.two,
    textAlign: "center",
  },

  footer: {
    backgroundColor: BrandColors.error,
    borderTopColor: "transparent",
    paddingHorizontal: Spacing.four,
    paddingTop: 0,
  },

  iconSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 96,
  },

  messageSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },

  title: {
    color: BrandColors.secondary,
    fontSize: 28,
    lineHeight: 35,
    textAlign: "center",
  },
});
