import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";

import { useAlertsStore } from "../store/alerts.store";

export function AlertPhotoScreen() {
  const colors = useTheme();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  const imageUrl = useAlertsStore(
    (state) => state.alerts.find((item) => item.alertId === alertId)?.imageUrl,
  );

  if (!imageUrl) {
    return (
      <PageLayout title="Photo">
        <Text style={[Typography.bodyLarge, { color: colors.textMuted }]}>
          No image available.
        </Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Photo" scrollable={false} contentFlush>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Image
          source={imageUrl}
          style={styles.image}
          contentFit="contain"
        />
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    width: "100%",
    flex: 1,
  },
});
