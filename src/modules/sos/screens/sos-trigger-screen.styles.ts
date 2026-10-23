import { BorderRadius, BrandColors, FontFamily, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  avatar: {
    borderColor: BrandColors.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    height: 28,
    width: 28,
    backgroundColor: BrandColors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  overlappingAvatar: { marginLeft: -4 },
  avatarImage: { width: "100%", height: "100%" },

  avatars: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },

  contactsDescription: {
    color: BrandColors.primary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 265,
  },

  contactsSection: {
    alignItems: "center",
    minHeight: 75,
  },

  container: {
    flex: 1,
  },

  initialText: {
    color: BrandColors.secondary,
    fontSize: 11,
    fontFamily: FontFamily.geistMedium,
  },
  sosRing: {
    backgroundColor: "#DCE8F8",
    borderRadius: BorderRadius.full,
    height: 220,
    width: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  sosButton: {
    alignItems: "center",
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    gap: Spacing.two,
    height: 190,
    justifyContent: "center",
    width: 190,
  },


  sosHint: {
    color: BrandColors.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  sosSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  sosText: {
    color: BrandColors.secondary,
    fontSize: 18,
    lineHeight: 23,
    textAlign: "center",
  },

  helpButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  contactsLink: { marginTop: Spacing.two, padding: Spacing.one },
  contactsLinkText: { color: "#0754AD", fontFamily: FontFamily.geistMedium, fontSize: 12 },
  loading: { marginBottom: Spacing.two },
  previewPanel: { gap: Spacing.two },
  previewLabel: { color: BrandColors.primary, fontFamily: FontFamily.geistMedium, fontSize: 11, textAlign: "center" },
  previewActions: { flexDirection: "row", gap: Spacing.two },
  previewButton: { flex: 1 },
});
