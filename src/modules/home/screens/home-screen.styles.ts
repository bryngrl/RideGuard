import { Typography } from "@/constants/theme";
import {
  BorderRadius,
  DeviceCardLayout,
  Colors,
  FontFamily,
  Spacing,
} from "@/shared/theme";
import { StyleSheet } from "react-native";

export const CAMERA_CARD_WIDTH = DeviceCardLayout.width;
export const CAMERA_CARD_GAP = DeviceCardLayout.gap;
export const CAMERA_CAROUSEL_END_PADDING = Spacing.four;

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
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },

  currentRideContainer: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },

  currentRideLabel: {
    flex: 1,
  },

  currentRideRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 28,
  },

  currentRideValue: {
    flex: 1,
    textAlign: "right",
  },

  deviceCards: {
    marginTop: Spacing.three + Spacing.half,
    marginHorizontal: -Spacing.four,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },

  deviceCardsScrollContent: {
    gap: CAMERA_CARD_GAP,
    paddingLeft: Spacing.four,
    paddingRight: CAMERA_CAROUSEL_END_PADDING,
  },

  deviceCardItem: {
    width: CAMERA_CARD_WIDTH,
  },
  deviceCard: {
    minHeight: DeviceCardLayout.minHeight,
  },
  monitoringCard: {
    minHeight: 150,
    borderRadius: BorderRadius.lg,
  },
  monitoringStateCard: {
    minHeight: 112,
  },
  monitoringStateTitle: {
    fontFamily: FontFamily.geistMedium,
    fontSize: 18,
    lineHeight: 24,
  },
  threatTitle: {
    fontFamily: FontFamily.geistSemiBold,
  },
  monitoringStateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  monitoringCardGradient: {
    position: "absolute",
    top: Spacing.two,
    bottom: Spacing.two,
    left: Spacing.four,
    right: Spacing.four,
    borderRadius: BorderRadius.lg,
  },
  emptyRides: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: Spacing.two,
  },


  greeting: {
    alignItems: "flex-end",
    flexShrink: 1,
    marginLeft: Spacing.two,
    maxWidth: "45%",
  },

  greetingHello: {
    fontSize: 16,
    lineHeight: 16,
    textAlign: "right",
  },

  greetingName: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: "right",
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    marginBottom: Spacing.two,
    paddingLeft: Spacing.two + Spacing.one,
    position: "relative",
    zIndex: 10,
  },


  statusGradient: {
    height: 150,
    left: 0,
    position: "absolute",
    right: 0,
    top: -100,
    zIndex: 0,
  },

  statusSection: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    position: "relative",
    zIndex: 2,
  },

  statusSectionWrapper: {
    marginHorizontal: -Spacing.four,
    position: "relative",
    zIndex: 1,
  },

  todaySection: {
    flex: 1,
    marginTop: Spacing.five,
  },
  cameraWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },

  cameraWarningText: {
    ...Typography.medium,
    fontSize: 13,
    color: Colors.light.dangerHeader,
    flexShrink: 1,
  },
});
