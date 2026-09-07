import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SensorSuccessScreen() {
  const router = useRouter();
  const theme = useTheme();

  //change this later to the one connected to test
  const [detectionTime, setDetectionTime] = useState("0.8s");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.replace("/metal-sensor/index");
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/camera-sensor/index");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="Test scan" scrollable={false} onBack={handleBack}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image
            source={require("@/assets/icons/circled-check.png")}
            style={styles.statusIcon}
            resizeMode="contain"
          />
          <Text
            style={[
              Typography.largeTitle,
              styles.heading,
              { color: theme.text },
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
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    paddingTop: Spacing.two,
    alignItems: "flex-start",
  },
  statusIcon: {
    width: 64,
    height: 64,
    marginBottom: Spacing.four,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
  },
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
    width: "100%",
  },
});
