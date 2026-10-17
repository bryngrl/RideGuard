import { StyleSheet } from "react-native";

import { Spacing, Typography } from "@/shared/theme";

export const styles = StyleSheet.create({
  form: {
    marginTop: Spacing.five,
  },
  field: {
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 44,
  },
  sendButton: {
    marginTop: Spacing.four,
    height: 41,
  },
  feedback: {
    ...Typography.bodySmall,
    marginTop: Spacing.three,
  },
  previewButton: {
    alignSelf: "center",
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
  previewText: {
    ...Typography.bodySmall,
    textDecorationLine: "underline",
  },
});
