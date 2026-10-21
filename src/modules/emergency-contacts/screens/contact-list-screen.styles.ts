import { Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  contactContent: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  description: {
    maxWidth: 300,
    marginTop: Spacing.two,
    textAlign: "center",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: Spacing.four,
  },
  emptyAction: { marginTop: Spacing.two, minHeight: 44, justifyContent: "center", paddingHorizontal: Spacing.two },
  loadingState: { alignItems: "center", flex: 1, gap: Spacing.two, justifyContent: "center" },
  errorState: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: Spacing.four },
  limitMessage: { marginBottom: Spacing.two },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: Spacing.four },
  title: {
    marginTop: Spacing.three,
    textAlign: "center",
    fontSize: 16,
  },
});
