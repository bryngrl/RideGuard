import { BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },

  description: {
    color: BrandColors.secondary,
    lineHeight: 16,
    marginTop: Spacing.three,
    textAlign: "center",
  },

  footer: {
    backgroundColor: BrandColors.error,
    borderTopColor: "transparent",
    paddingHorizontal: Spacing.four,
  },

  iconSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  messageSection: {
    alignItems: "center",
  },

  title: {
    color: BrandColors.secondary,
    textAlign: "center",
  },
});
