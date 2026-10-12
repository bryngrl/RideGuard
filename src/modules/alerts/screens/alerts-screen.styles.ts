import { Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },

  // Header
  header: {
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },

  // Section list
  listContent: {
    paddingBottom: Spacing.six ?? 32,
    paddingHorizontal: Spacing.four,
  },
  sectionHeader: {
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  sectionSeparator: {
    height: Spacing.one,
  },
  tab: {
    borderRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: 6,
  },
  tabActive: {
    // background set inline
  },
  tabInactive: {
    borderWidth: 1,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  tabText: {
    fontSize: 13,
  },
});
