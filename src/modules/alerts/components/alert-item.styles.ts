import { BorderRadius, BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  edgeToEdgeWrapper: {
    marginHorizontal: -Spacing.four,
  },

  container: {
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    width: "100%",
    paddingLeft: Spacing.five,
    paddingRight: Spacing.five,
    paddingVertical: 12,
  },

  // Left icon
  iconPlaceholder: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.three,
  },
  label: {
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1,
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: Spacing.two,
    marginBottom: 2,
    rowGap: 2,
  },
  manualBadge: {
    borderColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  manualBadgeText: {
    color: BrandColors.primary,
    fontSize: 11,
    lineHeight: 15,
  },
  pendingCircle: {
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  pressed: {
    opacity: 0.85,
  },

  // Right status indicator
  statusDot: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.two,
    width: 16,
  },
  subLabel: {
    marginTop: 2,
  },

  // Center text
  textBlock: {
    flex: 1,
    justifyContent: "center",
  },
  timeRange: {
    marginTop: 1,
  },
  unreadDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
