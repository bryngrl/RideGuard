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

  dropdownItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },

  dropdownMenu: {
    borderTopWidth: 0,
    borderWidth: 1.5,
    marginTop: -Spacing.one,
  },

  editContainer: {
    flex: 1,
    width: "100%",
  },

  formContainer: {
    width: "100%",
  },

  headerCancel: {
    fontWeight: "600",
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

  pillInput: {
    borderColor: "#ffffffff",
    borderRadius: BorderRadius.full,
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

  relationshipDropdown: {
    paddingBottom: Spacing.two,
    position: "relative",
    zIndex: 10,
  },

  saveButton: {
    borderRadius: BorderRadius.full,
  },
});
