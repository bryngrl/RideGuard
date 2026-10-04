import { BorderRadius, BrandColors, FontFamily, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  actionPressed: {
    opacity: 0.75,
  },

  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.half,
  },

  brandName: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 20,
    letterSpacing: -0.8,
    lineHeight: 24,
  },

  contactsButton: {
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: Spacing.three,
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
  },

  currentRideContainer: {
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },

  currentRideLabel: {
    flex: 1,
  },

  currentRideRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.one,
  },

  currentRideValue: {
    flex: 1,
    fontWeight: "500",
    textAlign: "right",
  },

  deviceCards: {
    marginTop: Spacing.two,
    position: "relative",
    zIndex: 2,
  },

  deviceCardsScrollContent: {
    gap: Spacing.one,
  },

  deviceCardItem: {
    width: 180,
  },
  emptyRides: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: Spacing.two,
  },

  endRideButton: {
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.two,
    marginTop: Spacing.three,
  },

  greeting: {
    alignItems: "flex-end",
  },

  greetingHello: {
    fontSize: 16,
    lineHeight: 16,
    textAlign: "right",
  },

  greetingName: {
    fontSize: 20,
    lineHeight: 20,
  },

  header: {
    alignItems: "center",
    elevation: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.half,
    paddingHorizontal: Spacing.two,
    position: "relative",
    zIndex: 10,
  },

  quickActions: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: Spacing.one,
  },

  quickActionsContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },

  rideButton: {
    borderRadius: BorderRadius.full,
    marginTop: Spacing.three,
  },

  sosButton: {
    alignItems: "center",
    backgroundColor: BrandColors.error,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: Spacing.three,
  },

  sosButtonText: {
    color: BrandColors.secondary,
  },

  statusGradient: {
    height: 100,
    left: 0,
    position: "absolute",
    right: 0,
    top: -40,
    zIndex: 0,
  },

  statusSection: {
    elevation: 2,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    position: "relative",
    zIndex: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    minWidth: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  statusSectionWrapper: {
    marginHorizontal: -Spacing.five,
    position: "relative",
    zIndex: 1,
  },

  todaySection: {
    flex: 1,
    minHeight: 86,
    marginTop: Spacing.three,
  },
});
