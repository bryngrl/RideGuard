import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  primaryButtonColor?: string;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  description,
  primaryButtonText,
  primaryButtonColor,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
}: ConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onSecondaryPress}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: theme.card,
            },
          ]}
        >
          <Text
            style={[
              Typography.h3,
              styles.title,
              {
                color: theme.text,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              Typography.body,
              styles.description,
              {
                color: theme.textMuted,
              },
            ]}
          >
            {description}
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onSecondaryPress}
              style={styles.secondaryButton}
              accessibilityRole="button"
              accessibilityLabel={secondaryButtonText}
            >
              <Text
                style={[
                  Typography.button,
                  styles.secondaryButtonText,
                  {
                    color: theme.primary,
                  },
                ]}
              >
                {secondaryButtonText}
              </Text>
            </Pressable>

            <Pressable
              onPress={onPrimaryPress}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: primaryButtonColor ?? theme.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryButtonText}
            >
              <Text
                style={[
                  Typography.button,
                  styles.primaryButtonText,
                  {
                    color: theme.textInverse,
                  },
                ]}
              >
                {primaryButtonText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },

  alertBox: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 24,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },

  title: {
    fontWeight: "600",
  },

  description: {
    marginTop: Spacing.three,
    lineHeight: 22,
  },

  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.five,
  },

  secondaryButton: {
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },

  secondaryButtonText: {
    fontWeight: "600",
  },

  primaryButton: {
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
  },

  primaryButtonText: {
    fontWeight: "600",
  },
});
