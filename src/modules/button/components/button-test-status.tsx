import SuccessIcon from "@/assets/icons/status/success.svg";
import { Spacing, Typography } from "@/shared/theme";
import { ButtonTestLoader } from "./button-test-loader";
import { StyleSheet, Text, View } from "react-native";

type ButtonTestStatusProps = {
  text: string;
  color: string;
  success?: boolean;
  subtitle?: string;
  subtitleColor?: string;
  iconColor?: string;
};

export function ButtonTestStatus({
  text,
  color,
  success = false,
  subtitle,
  subtitleColor = color,
  iconColor = color,
}: ButtonTestStatusProps) {
  return (
    <View style={styles.status}>
      <View style={styles.statusRow}>
        <View style={styles.statusIconSlot}>
          {success ? (
            <SuccessIcon width={24} height={24} />
          ) : (
            <ButtonTestLoader color={iconColor} />
          )}
        </View>
        <Text style={[Typography.body, { color }]}>{text}</Text>
      </View>
      {subtitle ? (
        <Text
          style={[
            Typography.body,
            styles.statusSubtitle,
            { color: subtitleColor },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: "flex-start",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "center",
    minHeight: 32,
  },
  statusIconSlot: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
    marginRight: Spacing.two,
  },
  statusSubtitle: {
    marginTop: Spacing.two,
    textAlign: "left",
    paddingLeft: Spacing.six,
  },
});
