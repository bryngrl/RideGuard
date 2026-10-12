import SearchIcon from "@/assets/icons/actions/search.svg";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import {
  ConfirmationModal,
  KeyboardAvoidingWrapper,
  ProfileAvatar,
  getProfileDisplayName,
} from "@/shared/ui";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SettingRow, SettingsSection } from "../../components/setting-row";
import { settingsRows, settingsSections } from "../../config/settings-rows";
import { useLogout } from "../../hooks/use-logout";
import { useProfile } from "../../hooks/use-profile";

export function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { profile } = useProfile();
  const logout = useLogout();
  const name = getProfileDisplayName(profile.firstName, profile.lastName);
  const vehicle =
    `${profile.vehicleBrand} ${profile.vehicleModel}`.trim() ||
    "No vehicle added";
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text
          style={[
            Typography.largeTitle,
            { color: colors.text, paddingBottom: Spacing.two },
          ]}
        >
          Settings
        </Text>
        {/* SEARCH BAR */}
        <Pressable
          onPress={() => router.push("/settings/search" as never)}
          style={[styles.search, { backgroundColor: "#F8F8F8" }]}
        >
          <SearchIcon width={18} height={18} />
          <Text style={[Typography.body, { color: colors.textMuted }]}>
            Search
          </Text>
        </Pressable>

        {/* PROFILE */}
        <Pressable
          onPress={() => router.push("/settings/account" as never)}
          style={styles.profile}
        >
          <ProfileAvatar name={name} />
          <View style={styles.profileCopy}>
            <Text
              style={[
                Typography.bodyLarge,
                { color: colors.text, fontFamily: "Geist-SemiBold" },
              ]}
            >
              {name}
            </Text>
            <Text style={[Typography.body, { color: colors.textMuted }]}>
              {vehicle}
            </Text>
          </View>
          <Text style={[Typography.h2, { color: colors.textMuted }]}>›</Text>
        </Pressable>
        {settingsSections.map((section) => (
          <SettingsSection key={section} title={section}>
            {settingsRows
              .filter((row) => row.section === section)
              .map((row) => (
                <SettingRow
                  key={row.id}
                  row={row}
                  onPress={() => router.push(row.route as never)}
                />
              ))}
            {section === "General" && (
              <SettingRow
                row={{
                  id: "logout",
                  title: "Log out",
                  section,
                  iconKey: "logout",
                  searchKeywords: [],
                }}
                danger
                onPress={logout.open}
              />
            )}
          </SettingsSection>
        ))}
      </KeyboardAvoidingWrapper>
      <BottomNavigation />
      <ConfirmationModal
        visible={logout.visible}
        title="Log out?"
        description="You will need to sign in again to access RideGuard."
        primaryButtonText="Log out"
        secondaryButtonText="Cancel"
        primaryButtonColor={colors.error}
        onPrimaryPress={logout.logout}
        onSecondaryPress={logout.close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: Spacing.three },
  search: {
    height: 44,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.four,
  },
  profileCopy: { flex: 1, marginLeft: Spacing.three },
});
