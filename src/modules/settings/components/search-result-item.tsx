import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { settingsIconMap } from "../config/icon-map";
import type { SettingsRowDefinition } from "../types/settings.types";

// Helper function to split text into matching and non-matching parts
function highlightMatch(
  title: string,
  query: string = "", // Add a default fallback value here
  accentColor: string,
  mutedColor: string,
) {
  // Safe guard in case query is still null/undefined
  if (!query || typeof query !== "string" || !query.trim()) {
    return <Text style={{ color: mutedColor }}>{title}</Text>;
  }

  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = title.split(regex);

  return (
    <Text>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        return (
          <Text
            key={index}
            style={{
              color: isMatch ? accentColor : mutedColor,
            }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

export function SearchResultItem({
  row,
  query,
  onPress,
}: {
  row: SettingsRowDefinition;
  query: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  const reducedMotion = useReducedMotion();
  const Icon = settingsIconMap[row.iconKey];

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(150)} exiting={reducedMotion ? undefined : FadeOut.duration(100)}>
    <Pressable
      onPress={onPress}
      style={styles.row}
      feedbackRadius={0}
      feedbackBehindContent
      accessibilityRole="button"
      accessibilityLabel={`${row.title}, ${row.section}`}
    >
      {Icon && <Icon width={20} height={20} />}
      <Text style={[Typography.bodyLarge, styles.label]} numberOfLines={2}>
        {highlightMatch(row.title, query, colors.accent, colors.textMuted)}
      </Text>
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: -Spacing.four,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four + Spacing.two,
    paddingVertical: Spacing.two,
  },
  label: { flex: 1 },
});
