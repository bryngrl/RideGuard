import { BorderRadius, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
    paddingTop: Spacing.four,
  },

  addPhotoText: {
    marginTop: Spacing.two,
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

  contactName: {
    fontWeight: "700",
    marginTop: Spacing.four,
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

  deleteText: {},

  editContainer: {
    flex: 1,
    width: "100%",
  },

  formContainer: {
    width: "100%",
  },

  headerEdit: {},

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
    marginTop: Spacing.one,
  },

  previewContainer: {
    flex: 1,
    width: "100%",
  },

  profileImage: {
    alignItems: "center",
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96,
  },

  profileImagePreview: {
    height: "100%",
    width: "100%",
  },

  profileSection: {
    alignItems: "center",
  },

  relationship: {
    marginTop: Spacing.one,
  },

  saveButton: {
    borderRadius: BorderRadius.full,
  },
});
