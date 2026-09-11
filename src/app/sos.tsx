import { PageLayout } from "@/components/ui/page-layout";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SosScreen() {
  const colors = useTheme();

  return (
    <PageLayout title="SOS" scrollable={false}>
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            pressed && styles.sosButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send SOS emergency alert"
        >
          <Text style={[Typography.h2, styles.sosText]}>Tap to send SOS</Text>
        </Pressable>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Spacing.seven,
  },
  description: {
    maxWidth: 260,
    marginBottom: Spacing.six,
    textAlign: "center",
  },
  sosButton: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.primary,
  },
  sosButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  sosText: {
    color: BrandColors.secondary,
  },
});
