import { styles } from "./complete-setup-screen.styles";
import AllSetIcon from "@/assets/icons/logos/all-set.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { useOnboardingStore } from "../store/onboarding.store";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteSetupScreen() {
  const router = useRouter();
  const theme = useTheme();

  const firstName = useOnboardingStore((state) => state.firstName);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("COMPLETE SETUP FIRST NAME:", firstName);
  }, [firstName]);

  const displayName =
    firstName && firstName.trim() !== "" ? firstName.trim() : "Jovilyn";

  const handleStartDriving = async () => {
    setIsLoading(true);

    try {
      router.replace("/(app)/(tabs)");
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
