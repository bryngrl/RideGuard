import { StyleSheet, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing } from "@/shared/theme";
import { SkeletonPulse } from "@/shared/ui/skeleton-pulse";
import { skeletonRowCount } from "@/shared/lib/skeleton-count";

export function ContactsSkeleton({ count }: { count?: number }) {
  const theme = useTheme();
  const fill = { backgroundColor: theme.border };
  return <SkeletonPulse label="Loading emergency contacts" style={styles.container}>
    {Array.from({ length: skeletonRowCount(count, 5) }, (_, index) => <View key={index} style={styles.row}>
      <View style={[styles.avatar, fill]} />
      <View style={styles.lines}>
        <View style={[styles.name, fill]} />
        <View style={[styles.number, fill]} />
      </View>
    </View>)}
  </SkeletonPulse>;
}

const styles = StyleSheet.create({
  container: { marginHorizontal: -Spacing.four },
  row: { minHeight: 72, paddingHorizontal: Spacing.five, paddingVertical: Spacing.two, flexDirection: "row", alignItems: "center", gap: Spacing.three },
  avatar: { height: 48, width: 48, borderRadius: BorderRadius.full },
  lines: { flex: 1, gap: Spacing.two },
  name: { height: 16, width: "64%", borderRadius: BorderRadius.full },
  number: { height: 12, width: "76%", borderRadius: BorderRadius.full },
});
