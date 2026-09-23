import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* PAGE CONTENT */}
      <View style={styles.content}>
        <Text
          style={[
            Typography.h1,
            {
              color: colors.text,
            },
          ]}
        >
          Settings
        </Text>

        {/* Your homepage components will go here */}
      </View>

      {/* BOTTOM NAVIGATION */}
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
});
