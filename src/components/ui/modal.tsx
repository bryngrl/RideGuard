import ErrorIcon from "@/assets/icons/modal-icon/error-icon.svg";
import LoadingIcon from "@/assets/icons/modal-icon/loading-icon.svg";
import SuccessIcon from "@/assets/icons/modal-icon/success-icon.svg";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

interface LoadingModalProps {
  visible: boolean;
  status: "loading" | "success" | "error";
  message: string;
}

export function LoadingModal({ visible, status, message }: LoadingModalProps) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (visible && status === "loading") {
      interval = setInterval(() => {
        setDotCount((prev) => (prev + 3) % 4);
      }, 400);
    } else {
      setDotCount(0);
    }
    return () => clearInterval(interval);
  }, [visible, status]);

  const displayMessage =
    status === "loading" ? "Verifying" + ".".repeat(dotCount) : message;

  const getTextColor = () => {
    if (status === "success") return BrandColors.success;
    if (status === "error") return BrandColors.error;
    return BrandColors.primary;
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertBox}>
          <View style={styles.contentContainer}>
            {status === "loading" && <LoadingIcon width={56} height={56} />}
            {status === "success" && <SuccessIcon width={56} height={56} />}
            {status === "error" && <ErrorIcon width={56} height={56} />}

            <Text
              style={[
                Typography.body,
                styles.messageText,
                { color: getTextColor() },
              ]}
            >
              {displayMessage}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    width: 169,
    minHeight: 169,
    borderRadius: BorderRadius.lg || 24,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    width: 48,
    height: 48,
    marginBottom: Spacing.three,
  },
  messageText: {
    textAlign: "center",
    fontWeight: "500",
    marginTop: Spacing.two,
  },
});
