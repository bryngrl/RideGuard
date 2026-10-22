import { BorderRadius, Spacing } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  actions: {
    marginTop: "auto",
    paddingBottom: Spacing.four,
    paddingTop: Spacing.four,
  },

  addPhotoText: {
    marginTop: Spacing.three,
  },

  cancelButton: {
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    marginTop: Spacing.two,
    minHeight: 40,
    paddingVertical: Spacing.two,
    width: "100%",
  },

  cancelText: {
    fontWeight: "600",
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
  },

  formContainer: {
    gap: Spacing.two,
    width: "100%",
  },

  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.five,
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

  saveButton: {
    borderRadius: 999,
  },
});
