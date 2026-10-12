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

  container: {
    flex: 1,
  },

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

  formContainer: {
    width: "100%",
  },

  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },

  pillInput: {
    backgroundColor: "#F6F6F6",
    borderColor: "#D9D9D9",
    borderRadius: BorderRadius.full,
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

  relationshipDropdown: {
    paddingBottom: Spacing.two,
    position: "relative",
    zIndex: 10,
  },

  saveButton: {
    borderRadius: 999,
  },
});
