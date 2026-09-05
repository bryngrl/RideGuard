import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function TestSensorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartScan = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.replace("/metal-sensor/test-page");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Primary-Icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Test your metal{"\n"}sensor
            </Text>
            <Text
              style={[
                Typography.body,
                { color: theme.textMuted, marginTop: Spacing.two },
              ]}
            >
              Hold a metal object like your keys near the passenger door, then
              tap start.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Start test scan"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleStartScan}
            isLoading={isLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
    paddingTop: 72,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
  },
});
