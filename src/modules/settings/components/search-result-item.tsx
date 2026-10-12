import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Pressable, StyleSheet, Text } from "react-native";
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
  const Icon = settingsIconMap[row.iconKey];

  return (
    <Pressable onPress={onPress} style={[styles.row, {}]}>
      {Icon && <Icon width={24} height={24} />}
      <Text style={[Typography.medium]}>
        {highlightMatch(row.title, query, colors.accent, colors.textMuted)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
});
