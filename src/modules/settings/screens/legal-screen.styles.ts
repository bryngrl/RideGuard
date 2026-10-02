import { FontFamily, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  bullet: {
    width: Spacing.two,
  },

  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },

  bulletText: {
    flex: 1,
  },

  list: {
    gap: 0,
  },

  paragraph: {
    marginBottom: Spacing.half,
  },

  section: {
    marginBottom: Spacing.four,
  },

  sectionContent: {
    gap: Spacing.one,
  },

  sectionTitle: {
    marginBottom: Spacing.two,
  },

  subsection: {
    gap: 0,
    marginTop: Spacing.two,
  },

  subsectionContent: {
    gap: Spacing.two,
  },

  subsectionTitle: {
    fontFamily: FontFamily.geistSemiBold,
    fontSize: 12,
    lineHeight: 20,
  },
});
