import SuccessIcon from "@/assets/icons/status/success.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function MetalSensorSuccessScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [detectionTime] = useState("0.8s");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.replace("/devices/button" as any);
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/devices/camera" as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="Test scan" scrollable={false} onBack={handleBack}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <SuccessIcon width={64} height={64} />
          <Text
            style={[
              Typography.largeTitle,
              styles.heading,
              { color: theme.text, paddingTop: Spacing.three },
            ]}
          >
            Sensor is working
          </Text>
          <Text
            style={[
              Typography.body,
              { color: theme.textMuted, marginTop: Spacing.one },
            ]}
          >
            Metal object detected in{" "}
            <Text style={{ fontWeight: "700", color: theme.text }}>
              {detectionTime}
            </Text>
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleNext}
            isLoading={isLoading}
          />
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: Spacing.four,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 24,
  },
  topSection: {
    alignItems: "flex-start",
    flex: 1,
    paddingTop: Spacing.six,
  },
});
