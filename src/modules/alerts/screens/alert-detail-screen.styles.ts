import { BorderRadius, BrandColors, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const previewStyles = StyleSheet.create({
  centered: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    marginBottom: Spacing.four,
  },
  gallery: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  main: {
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.sm,
    maxHeight: 320,
    overflow: "hidden",
    width: "100%",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 9999,
    flexDirection: "row",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  playText: {
    color: "#FFFFFF",
  },
  thumb: {
    borderRadius: BorderRadius.sm,
    height: 56,
    overflow: "hidden",
    width: 72,
  },
  viewImage: {
    alignSelf: "flex-start",
    marginTop: Spacing.two,
  },
});

export const clipStyles = StyleSheet.create({
  unavailableText: {
    marginBottom: Spacing.four,
    marginTop: -Spacing.two,
  },
});

export const viewerStyles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: "#00000099",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.four,
    top: Spacing.four,
    width: 40,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  container: {
    backgroundColor: "#000000",
    flex: 1,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  pageIndicator: {
    backgroundColor: "#00000099",
    borderRadius: 14,
    bottom: Spacing.four,
    color: "#FFFFFF",
    fontSize: 14,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    position: "absolute",
    alignSelf: "center",
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
  cameraLabel: {
    marginBottom: Spacing.five,
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
