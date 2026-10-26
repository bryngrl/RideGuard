import { BrandColors, Colors, FontFamily } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const createStyles = (colors: typeof Colors.light | typeof Colors.dark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  sosSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 32,
    minHeight: 400,
  },
  sosWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 232,
    height: 232,
    borderRadius: 116,
    backgroundColor: colors.backgroundElement,
  },
  innerRing: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: colors.backgroundSelected,
  },
  sosButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: "#C82018",
    gap: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sosText: {
    color: BrandColors.secondary,
    fontFamily: FontFamily.geistSemiBold,
    fontSize: 44,
    lineHeight: 54,
  },
  sosHint: {
    color: BrandColors.secondary,
    fontFamily: FontFamily.geistSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  cancelHintBlock: {
    alignSelf: "stretch",
    flexShrink: 0,
  },
  cancelHint: {
    color: colors.text,
    fontFamily: FontFamily.geistRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  emphasis: {
    fontFamily: FontFamily.geistSemiBold,
  },
  contactsDescription: {
    color: colors.text,
    fontFamily: FontFamily.geistRegular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  contactsSection: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    gap: 16,
  },
  contactsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 26,
    gap: 8,
  },
  contactsTitle: {
    color: colors.text,
    fontFamily: FontFamily.geistMedium,
    fontSize: 12,
    flexShrink: 1,
  },
  manageLink: {
    color: colors.accent,
    fontFamily: FontFamily.geistRegular,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  contactsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarFrame: {
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.card,
  },
  overlappingAvatar: {
    marginLeft: -6,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  initialAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    fontFamily: FontFamily.geistMedium,
    fontSize: 10,
  },
  contactsCount: {
    color: colors.text,
    fontFamily: FontFamily.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
  },
});
