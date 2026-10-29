import WarningIcon from "@/assets/icons/alerts/primary-warning.svg";
import { useEffect, useState } from "react";
import { subscribeMpinLock } from "@/modules/mpin/services/mpin-activity";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button, type ButtonVariant } from "@/shared/ui/button";

export type SweetAlertType = "info" | "success" | "warning" | "error";

interface SweetAlertProps {
  visible: boolean;

  title: string;
  description?: string;

  type?: SweetAlertType;
  showIcon?: boolean;

  primaryButtonText?: string;
  secondaryButtonText?: string;

  primaryButtonVariant?: ButtonVariant;
  secondaryButtonVariant?: ButtonVariant;
  buttonBorderRadius?: number;

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
  showIcon = true,

  primaryButtonText = "Confirm",
  secondaryButtonText,

  primaryButtonVariant = "primary",
  secondaryButtonVariant = "secondary",
  buttonBorderRadius = BorderRadius.full,

  onPrimaryPress,
  onSecondaryPress,
  onClose,

  isLoading = false,

  closeOnBackdropPress = false,
}: SweetAlertProps) {
  const theme = useTheme();
  const [interrupted, setInterrupted] = useState(false);
  useEffect(() => {
    if (!visible) { setInterrupted(false); return; }
    return subscribeMpinLock(() => { setInterrupted(true); onClose?.(); });
  }, [visible, onClose]);

  const getIconColor = () => {
    switch (type) {
      case "success":
        return theme.success;

      case "warning":
        return theme.primary;

      case "error":
        return theme.error;

      case "info":
      default:
        return theme.primary;
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
      visible={visible && !interrupted}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Pressable
          style={[
            styles.alertContainer,
            {
              backgroundColor: theme.modalSurface,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          {/* CONTENT */}
          <View style={styles.content}>
            {/* ICON */}
            {showIcon && (
              <View style={styles.iconContainer}>
                {type === "warning" ? (
                  <WarningIcon width={48} height={48} />
                ) : (
                  <Ionicons name={getIconName()} size={30} color={iconColor} />
                )}
              </View>
            )}

            {/* TEXT */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  Typography.bodyLarge,
                  styles.title,
                  {
                    color: theme.text,
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
              fullWidth
              isLoading={isLoading}
              onPress={onPrimaryPress}
              style={[styles.primaryButton, { paddingHorizontal: Spacing.two, borderRadius: buttonBorderRadius }]}
            />
            {secondaryButtonText && (
              <Button
                title={secondaryButtonText}
                variant={secondaryButtonVariant}
                size="md"
                fullWidth
                disabled={isLoading}
                onPress={handleSecondaryPress}
                style={[
                  styles.secondaryButton,
                  {
                    borderWidth: 0,
                    borderColor: "transparent",
                    paddingHorizontal: Spacing.two,
                    borderRadius: buttonBorderRadius,
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
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
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },

  secondaryButton: {
    width: "100%",
    minHeight: 44,
  },

  primaryButton: {
    width: "100%",
    minHeight: 44,
  },
});
