import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useOnboardingStore } from "@/modules/onboarding";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { ConfirmationModal, KeyboardAvoidingWrapper } from "@/shared/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SettingRow, SettingsSection } from "../components/setting-row";
import { SETTINGS_SECTIONS } from "../constants";

export function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const firstName = useOnboardingStore((state) => state.firstName);
  const lastName = useOnboardingStore((state) => state.lastName);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const name =
    [firstName, lastName].filter(Boolean).join(" ") || "Your profile";
  const logout = async () => {
    try {
      await signOut(auth);
      clearAuth();
      setLogoutVisible(false);
      router.replace("/(public)/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Logout failed", "Something went wrong while logging out.");
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text style={[Typography.largeTitle, { color: colors.text }]}>
          Settings
        </Text>
        {/* SEARCH BAR */}
        <Pressable
          onPress={() => router.push("/settings/search" as never)}
          style={[styles.search, { backgroundColor: "#F8F8F8" }]}
        >
          {/* TODO: INLINE ICON */}
          <Text style={{ color: colors.textMuted }}>Search</Text>
        </Pressable>
        {/* PROFILE */}
        <Pressable
          onPress={() => router.push("/settings/account" as never)}
          style={[styles.profile, {}]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.h3, { color: colors.textInverse }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={[Typography.h3, { color: colors.text }]}>{name}</Text>
            {/* TODO: VEHICLE NAME */}
            <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
              Manage your account
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            weight={2}
            color={colors.textMuted}
          />{" "}
        </Pressable>

        {SETTINGS_SECTIONS.map((section) => (
          <SettingsSection key={section.title} title={section.title}>
            {section.rows.map((row) => (
              <SettingRow
                key={row.title}
                title={row.title}
                icon={
                  row.icon === "filmstrip"
                    ? "film-outline"
                    : row.icon === "notification"
                      ? "notifications-outline"
                      : row.icon === "contact"
                        ? "people-outline"
                        : row.icon === "display"
                          ? "contrast-outline"
                          : row.icon === "location"
                            ? "location-outline"
                            : row.icon === "camera"
                              ? "camera-outline"
                              : "document-text-outline"
                }
                onPress={() => router.push(row.route as never)}
              />
            ))}
            {section.title === "General" && (
              <SettingRow
                title="Log out"
                icon="log-out-outline"
                danger
                onPress={() => setLogoutVisible(true)}
              />
            )}
          </SettingsSection>
        ))}
      </KeyboardAvoidingWrapper>
      <BottomNavigation />
      <ConfirmationModal
        visible={logoutVisible}
        title="Log out?"
        description="You will need to sign in again to access RideGuard."
        primaryButtonText="Log out"
        secondaryButtonText="Cancel"
        primaryButtonColor={colors.error}
        onPrimaryPress={logout}
        onSecondaryPress={() => setLogoutVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 0 },
  profile: {
    marginVertical: Spacing.three,
    borderRadius: 16,
    padding: Spacing.two,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCopy: { flex: 1, marginLeft: Spacing.three },
  search: {
    marginTop: Spacing.three,
    borderRadius: 999,
    padding: Spacing.three,
  },
});
