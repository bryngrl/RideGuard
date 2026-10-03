import SearchingIcon from "@/assets/icons/sensors/button/searching.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export function MetalSensorTestScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleBack = () => {
    router.replace("/devices/button" as any);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/devices/button/sensor-success" as any);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PageLayout title="Test scan" scrollable={false} onBack={handleBack}>
      <View style={styles.container}>
        <View style={styles.contentCenter}>
          <SearchingIcon width={180} height={180} />

          <Text
            style={[
              Typography.body,
              { color: theme.textMuted, marginTop: Spacing.half },
            ]}
          >
            Scanning any metal object
          </Text>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  contentCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
});
