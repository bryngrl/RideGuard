import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, ButtonVariant } from "@/components/ui/button";
import {
    BorderRadius,
    BrandColors,
    Spacing,
    Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type SweetAlertType = "info" | "success" | "warning" | "error";

interface SweetAlertProps {
  visible: boolean;

  title: string;
  description?: string;

  type?: SweetAlertType;

  primaryButtonText?: string;
  secondaryButtonText?: string;

  primaryButtonVariant?: ButtonVariant;
  secondaryButtonVariant?: ButtonVariant;

  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;

  isLoading?: boolean;

  closeOnBackdropPress?: boolean;
}

export function SweetAlert({
  visible,
  title,
  description,

  type = "info",

  primaryButtonText = "Confirm",
  secondaryButtonText,

  primaryButtonVariant = "primary",
  secondaryButtonVariant = "secondary",

  onPrimaryPress,
  onSecondaryPress,
  onClose,

  isLoading = false,

  closeOnBackdropPress = false,
}: SweetAlertProps) {
  const theme = useTheme();

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#22C55E";

      case "warning":
        return BrandColors.primary;

      case "error":
        return theme.error;

      case "info":
      default:
        return BrandColors.primary;
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark";

      case "error":
        return "close";

      case "info":
      default:
        return "information";
    }
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress && !isLoading) {
      onClose?.();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
      return;
    }

    onClose?.();
  };

  const iconColor = getIconColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Pressable
          style={[
            styles.alertContainer,
            {
              backgroundColor: theme.backgroundElement,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          {/* CONTENT */}
          <View style={styles.content}>
            {/* ICON */}
            <View
              style={[
                styles.iconContainer,
                {
                  borderColor: iconColor,
                },
              ]}
            >
              {type === "warning" ? (
                <Text
                  style={[
                    styles.warningIcon,
                    {
                      color: BrandColors.primary,
                    },
                  ]}
                >
                  !
                </Text>
              ) : (
                <Ionicons name={getIconName()} size={30} color={iconColor} />
              )}
            </View>

            {/* TEXT */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  Typography.bodyLarge,
                  styles.title,
                  {
                    color: BrandColors.primary,
                  },
                ]}
              >
                {title}
              </Text>

              {description && (
                <Text
                  style={[
                    Typography.caption,
                    styles.description,
                    {
                      color: theme.textMuted,
                    },
                  ]}
                >
                  {description}
                </Text>
              )}
            </View>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonContainer}>
            <Button
              title={primaryButtonText}
              variant={primaryButtonVariant}
              size="md"
              fullWidth={false}
              isLoading={isLoading}
              onPress={onPrimaryPress}
              style={styles.primaryButton}
            />

            {secondaryButtonText && (
              <Button
                title={secondaryButtonText}
                variant={secondaryButtonVariant}
                size="md"
                fullWidth={false}
                disabled={isLoading}
                onPress={handleSecondaryPress}
                style={[
                  styles.secondaryButton,
                  {
                    borderWidth: 0,
                    borderColor: "transparent",
                  },
                ]}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },

  alertContainer: {
    width: "100%",
    padding: Spacing.five,
    borderRadius: BorderRadius.lg,
  },
  content: {
    alignItems: "flex-start",
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 32,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },

  warningIcon: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 52,
    textAlign: "center",
  },

  textContainer: {
    width: "100%",
  },

  title: {
    fontWeight: "700",
    textAlign: "left",
  },

  description: {
    marginTop: Spacing.one,
    lineHeight: 20,
    textAlign: "left",
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },

  secondaryButton: {
    flex: 1,
  },

  primaryButton: {
    flex: 1,
  },
});
