import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function CompleteSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { firstName } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const displayName =
    firstName && firstName.trim() !== "" ? firstName : "Jovilyn";

  const handleStartDriving = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <View style={styles.iconContainer}>
            <Image
              source={require("@/assets/images/all-set-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text
            style={[Typography.largeTitle, styles.title, { color: theme.text }]}
          >
            You're all set,{"\n"}
            {displayName}
          </Text>

          <Text
            style={[
              Typography.body,
              styles.subtitle,
              { color: theme.textMuted },
            ]}
          >
            Your hardware is connected and Rideguard is watching out for you.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Start driving"
            variant="primary"
            size="md"
            fullWidth={true}
            onPress={handleStartDriving}
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
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },
  iconContainer: {
    marginBottom: Spacing.five,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: Spacing.two,
    width: "100%",
  },
});
