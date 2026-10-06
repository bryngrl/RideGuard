import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";

import { Button, KeyboardAvoidingWrapper } from "@/shared/ui";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { Alert } from "react-native";
export function SettingsScreen() {
  const colors = useTheme();

  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getAuth();

      await signOut(auth);

      router.replace("/(public)/sign-in");
    } catch (error) {
      console.error("Logout error:", error);

      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again.",
      );
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[Typography.h1, { color: colors.text }]}>Settings</Text>
          <View style={styles.logout}>
            <Button
              title="Log out"
              variant="danger"
              size="md"
              fullWidth
              onPress={handleLogout}
            />
          </View>
        </View>
        <BottomNavigation />
      </View>
    </KeyboardAvoidingWrapper>
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
  logout: {
    alignContent: "center",
  },
});
