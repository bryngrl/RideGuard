import { BorderRadius, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
    paddingTop: Spacing.four,
  },

  addPhotoText: {
    marginTop: Spacing.three,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },

  cancelText: {
    fontWeight: "600",
  },

  contactBackground: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },

  darkContactBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    aspectRatio: 402 / 638,
  },

  contactName: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 30,
    marginTop: Spacing.three,
  },

  deleteButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },

  deleteContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing.four,
  },

  deleteText: { fontSize: 14, lineHeight: 20 },

  editContainer: {
    flex: 1,
    width: "100%",
  },

  editPageContent: {
    paddingTop: Spacing.six,
  },

  formContainer: {
    gap: Spacing.two,
    width: "100%",
  },

  pageBackground: {
    ...StyleSheet.absoluteFill,
  },

  pageContent: {
    flex: 1,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    position: "relative",
  },

  pageContentForeground: {
    flex: 1,
    zIndex: 1,
  },

  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },

  phoneNumber: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: Spacing.one,
  },

  previewContainer: {
    flex: 1,
    width: "100%",
  },

  previewImage: {
    borderRadius: 78,
    height: 156,
    width: 156,
  },

  previewPageContent: {
    paddingTop: Spacing.six,
  },

  profileImage: {
    alignItems: "center",
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    overflow: "hidden",
    width: 112,
  },

  profileImagePreview: {
    height: "100%",
    width: "100%",
  },

  profileSection: {
    alignItems: "center",
  },

  relationship: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.one,
  },

  saveButton: {
    borderRadius: BorderRadius.full,
  },
});
