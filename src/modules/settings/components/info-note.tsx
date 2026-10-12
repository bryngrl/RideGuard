import InfoIcon from "@/assets/icons/settings/about.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";
export function InfoNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <InfoIcon width={20} height={20} />
      <View style={styles.copy}>
        <Text
          style={[
            Typography.body,
            { color: colors.text, fontFamily: "Geist-SemiBold" },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            Typography.bodySmall,
            { color: colors.textMuted, marginTop: Spacing.one },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.three, alignItems: "flex-start" },
  copy: { flex: 1 },
});
