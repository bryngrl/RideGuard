import { BrandColors, FontFamily, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  slider: { height: 56 },
  contactsList: { gap: 14 },
  contactCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 17, paddingVertical: 16, gap: 14 },
  contactHeader: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 50 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: FontFamily.geistSemiBold, fontSize: 16, lineHeight: 22 },
  contactName: { flex: 1, fontFamily: FontFamily.geistSemiBold, fontSize: 18, lineHeight: 24 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, maxWidth: "48%" },
  statusText: { fontFamily: FontFamily.geistSemiBold, fontSize: 14, lineHeight: 18, textAlign: "center" },
  progressTrack: { flexDirection: "row", gap: 5 },
  progressSegment: { flex: 1, height: 6, borderRadius: 3 },
  contactDetails: { gap: 10 },
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
