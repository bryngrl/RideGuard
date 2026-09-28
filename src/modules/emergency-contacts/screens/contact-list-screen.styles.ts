import { Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  contactContent: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
  },
  description: {
    maxWidth: 280,
    marginTop: Spacing.two,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: Spacing.seven,
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  title: {
    marginTop: Spacing.three,
    textAlign: "center",
  },
});
