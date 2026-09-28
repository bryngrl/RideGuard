import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useLogout } from "@/modules/auth";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function SettingsScreen() {
  const colors = useTheme();
  const { logout, isLoggingOut } = useLogout();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[Typography.h1, { color: colors.text }]}>Settings</Text>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={logout}
          disabled={isLoggingOut}
        >
          <Text style={[Typography.button, styles.logoutButtonText]}>
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Text>
        </TouchableOpacity>
      </View>
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
  logoutButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
  },
});
