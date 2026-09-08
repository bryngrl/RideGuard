import AllSetIcon from "@/assets/icons/variant-logo/all-set-icon.svg";
import { Button } from "@/components/ui/button";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteSetupScreen() {
  const router = useRouter();
  const theme = useTheme();

  const firstName = useAuthStore((state) => state.firstName);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("COMPLETE SETUP FIRST NAME:", firstName);
  }, [firstName]);

  const displayName =
    firstName && firstName.trim() !== "" ? firstName.trim() : "there";

  const handleStartDriving = async () => {
    setIsLoading(true);

    try {
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.centerSection}>
          <AllSetIcon width={96} height={96} />

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
            Your hardware is connected and RideGuard is watching out for you.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title="Start driving"
            variant="primary"
            size="md"
            fullWidth
            onPress={handleStartDriving}
            isLoading={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },

  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    textAlign: "center",
    marginBottom: Spacing.two,
  },

  subtitle: {
    textAlign: "center",
    maxWidth: 280,
  },

  footer: {
    width: "100%",
    paddingBottom: Spacing.five,
  },
});
