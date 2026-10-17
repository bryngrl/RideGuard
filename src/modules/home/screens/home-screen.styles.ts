import { Typography } from "@/constants/theme";
import {
  BorderRadius,
  Colors,
  FontFamily,
  Spacing,
} from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    flexDirection: "row",
  },

  brandName: {
    fontFamily: FontFamily.eloquiaExtraBold,
    fontSize: 24,
    letterSpacing: -0.8,
    lineHeight: 26,
    marginLeft: -2,
    transform: [{ translateY: 7 }],
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
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
    marginTop: Spacing.four,
    position: "relative",
    zIndex: 2,
  },

  deviceCardsScrollContent: {
    gap: Spacing.one,
  },

  deviceCardItem: {
    width: 162,
  },
  deviceCard: {
    minHeight: 90,
  },
  monitoringCard: {
    minHeight: 150,
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
    paddingLeft: Spacing.two,
    position: "relative",
    zIndex: 10,
  },

  rideButton: {
    borderRadius: BorderRadius.full,
    marginTop: Spacing.three,
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
    paddingHorizontal: Spacing.four,
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
    marginHorizontal: -Spacing.four,
    position: "relative",
    zIndex: 1,
  },

  todaySection: {
    flex: 1,
    minHeight: 86,
    marginTop: Spacing.four,
  },
  cameraWarning: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: Spacing.two,
    paddingLeft: Spacing.two,
    gap: Spacing.one,
  },

  cameraWarningText: {
    ...Typography.medium,
    fontSize: 12,
    color: Colors.light.dangerHeader,
  },
});
