import { PageLayout } from "@/components/ui/page-layout";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

export default function TestScanActiveScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleBack = () => {
    router.replace("/metal-sensor"); // Update this path to match your file structure if needed
  };

  return (
    <PageLayout title="Test scan" scrollable={false} onBack={handleBack}>
      <View style={styles.container}>
        <View style={styles.contentCenter}>
          <Image
            source={require("@/assets/icons/searching-icon.png")}
            style={styles.scanIcon}
            resizeMode="contain"
          />
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanIcon: {
    width: 180,
    height: 180,
  },
});
