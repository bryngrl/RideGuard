import { StyleSheet } from "react-native";
import { BorderRadius, Spacing } from "@/shared/theme";

export const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.four,
  },
  topSection: { flex: 1, paddingTop: Spacing.four },
  logoContainer: { alignItems: "flex-start", marginBottom: Spacing.five },
  logo: { width: 60, height: 60 },
  headerContainer: { alignItems: "flex-start", marginBottom: Spacing.five },
  permissionsList: { gap: Spacing.four },
  permissionItem: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.three,
  },
  permissionIcon: { width: 16, height: 16 },
  textContainer: { flex: 1 },
  checkIcon: { width: 16, height: 16, marginLeft: Spacing.three },
  buttonContainer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
