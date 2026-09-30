import { BorderRadius, BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const gridStyles = StyleSheet.create({
  cell: {
    aspectRatio: 1.45,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    width: "49%",
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: Spacing.four,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});

export const bannerStyles = StyleSheet.create({
  changeText: {
    marginTop: Spacing.one,
    textDecorationLine: "underline",
  },
  container: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.five,
    padding: Spacing.three,
    width: "100%",
  },
  iconContainer: {
    paddingRight: Spacing.two,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  infoText: {
    flex: 1,
  },
  mainText: {
    fontWeight: "600",
    marginBottom: 2,
  },
  textBlock: {
    flex: 1,
  },
});

export const timelineStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.five,
  },
  description: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.three,
  },
  time: {
    textAlign: "right",
    width: 64,
  },
});

export const responseStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.five,
  },
  infoIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: Spacing.three,
  },
});

export const contentStyles = StyleSheet.create({
  alertTitle: {
    fontWeight: "700",
    marginBottom: 2,
  },
  scroll: {
    paddingBottom: Spacing.six ?? 32,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
  },
  timeLabel: {
    marginLeft: Spacing.two,
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.four,
  },
});

export const footerStyles = StyleSheet.create({
  flagButton: {
    backgroundColor: BrandColors.error,
    borderRadius: 9999,
    borderWidth: 0,
  },
  flagButtonText: {
    color: "#FFFFFF",
  },
});
