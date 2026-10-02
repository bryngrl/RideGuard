import { BorderRadius, Spacing } from "@/shared/theme";
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
    marginBottom: 2,
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
    marginLeft: Spacing.three,
    width: 18,
  },
  subLabel: {
    marginTop: 2,
    fontStyle: "italic",
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
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
