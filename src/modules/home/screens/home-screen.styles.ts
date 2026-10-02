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
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.two,
    position: "relative",
    zIndex: 2,
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

  sectionTitle: {
    fontSize: 16,
  },

  silentNotificationCard: {
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.two,
    marginVertical: Spacing.three,
    minHeight: 50,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },

  silentNotificationDescription: {
    fontSize: 11,
    marginTop: 1,
  },

  silentNotificationIcon: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },

  silentNotificationTextContainer: {
    flex: 1,
  },

  silentNotificationTitle: {
    fontWeight: "500",
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

  statusSectionWrapper: {
    marginHorizontal: -Spacing.five,
    position: "relative",
    zIndex: 1,
  },

  systemStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },

  systemStatusIcon: {
    alignItems: "center",
    borderRadius: BorderRadius.full,
    height: 14,
    justifyContent: "center",
    width: 14,
  },

  systemStatusText: {
    flex: 1,
    flexShrink: 1,
  },

  todaySection: {
    flex: 1,
    minHeight: 86,
    marginTop: Spacing.three,
  },
});
