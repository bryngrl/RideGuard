import { FlashList } from "@shopify/flash-list";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

import { END_REACHED_THRESHOLD } from "../constants";
import type { AlertItem } from "../types/alert.types";
import { AlertRow } from "./alert-row";

interface AlertListProps {
  data: AlertItem[];
  ListHeaderComponent?: ReactElement;
  ListFooterComponent?: ReactElement | null;
  onPressItem?: (alert: AlertItem) => void;
  onEndReached?: () => void;
}

export function AlertList({
  data,
  ListHeaderComponent,
  ListFooterComponent,
  onPressItem,
  onEndReached,
}: AlertListProps) {
  const colors = useTheme();

  return (
    <FlashList
      data={data}
      keyExtractor={(item) => item.alertId}
      renderItem={({ item }) => (
        <AlertRow alert={item} onPress={() => onPressItem?.(item)} />
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={[Typography.bodyLarge, { color: colors.textMuted }]}>
            No alerts to show.
          </Text>
        </View>
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.five,
  },
  empty: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    alignItems: "center",
  },
});
