import { BorderRadius, BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  avatar: {
    borderColor: BrandColors.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    height: 38,
    marginHorizontal: -4,
    width: 38,
  },

  avatars: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },

  contactsDescription: {
    color: BrandColors.primary,
    lineHeight: 20,
    textAlign: "center",
  },

  contactsSection: {
    alignItems: "center",
    marginTop: Spacing.seven,
  },

  container: {
    flex: 1,
  },

  initialAvatar: {
    alignItems: "center",
    backgroundColor: BrandColors.primary,
    justifyContent: "center",
  },

  initialText: {
    color: BrandColors.secondary,
    fontSize: 14,
    fontWeight: "600",
  },

  pulseCircle: {
    backgroundColor: "#DCE8F8",
    borderRadius: BorderRadius.full,
    height: 210,
    position: "absolute",
    width: 210,
  },

  sosButton: {
    alignItems: "center",
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    gap: Spacing.two,
    height: 190,
    justifyContent: "center",
    width: 190,
    zIndex: 2,
  },

  sosButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },

  sosHint: {
    color: BrandColors.secondary,
    textAlign: "center",
  },

  sosSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  sosText: {
    color: BrandColors.secondary,
    textAlign: "center",
  },

  sosWrapper: {
    alignItems: "center",
    height: 230,
    justifyContent: "center",
    width: 230,
  },
});
