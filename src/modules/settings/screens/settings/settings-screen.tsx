import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import {
  ConfirmationModal,
  KeyboardAvoidingWrapper,
  ProfileAvatar,
  getProfileDisplayName,
} from "@/shared/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SettingsSearch } from "../../components/settings-search";
import { SettingsChevron } from "../../components/settings-chevron";
import { SettingRow, SettingsSection } from "../../components/setting-row";
import { settingsRows, settingsSections } from "../../config/settings-rows";
import { useLogout } from "../../hooks/use-logout";
import { useProfile } from "../../hooks/use-profile";

const SETTINGS_TITLE_LINE_HEIGHT = 42;
const TITLE_BLOCK_HEIGHT = SETTINGS_TITLE_LINE_HEIGHT + Spacing.two;

export function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { profile } = useProfile();
  const logout = useLogout();
  const [searchOpen, setSearchOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const searchProgress = useSharedValue(0);
  useEffect(() => {
    searchProgress.value = reducedMotion
      ? (searchOpen ? 1 : 0)
      : withTiming(searchOpen ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.cubic) });
  }, [reducedMotion, searchOpen, searchProgress]);
  const titleStyle = useAnimatedStyle(() => ({
    height: TITLE_BLOCK_HEIGHT * (1 - searchProgress.value),
    opacity: 1 - searchProgress.value,
  }));
  const topInsetStyle = useAnimatedStyle(() => ({
    height: Spacing.five - (Spacing.five - Spacing.three) * searchProgress.value,
  }));
  const name = getProfileDisplayName(profile.firstName, profile.lastName);
  const vehicle =
    `${profile.vehicleBrand} ${profile.vehicleModel}`.trim() ||
    "No vehicle added";
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Animated.View style={topInsetStyle} />
        <Animated.View style={[styles.titleContainer, titleStyle]} accessibilityElementsHidden={searchOpen} importantForAccessibility={searchOpen ? "no-hide-descendants" : "auto"}>
          <Text style={[Typography.largeTitle, styles.title, { color: colors.text }]}>Settings</Text>
        </Animated.View>
        <SettingsSearch active={searchOpen} onOpen={() => setSearchOpen(true)} onClose={() => setSearchOpen(false)} />
        {!searchOpen && <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(180)} exiting={reducedMotion ? undefined : FadeOut.duration(120)}>
        {/* PROFILE */}
        <Pressable
          onPress={() => router.push("/settings/account" as never)}
          style={styles.profile}
          feedbackRadius={0}
          feedbackInsets={{ top: -Spacing.three, right: -Spacing.four, bottom: -Spacing.three, left: -Spacing.four }}
          feedbackBehindContent
        >
          <ProfileAvatar name={name} photoUrl={profile.photoUrl} size={56} />
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
          <SettingsChevron color={colors.textMuted} />
        </Pressable>
        {settingsSections.map((section) => (
          <SettingsSection key={section} title={section} last={section === settingsSections[settingsSections.length - 1]}>
            {settingsRows
              .filter((row) => row.section === section)
              .map((row, index, rows) => (
                <SettingRow
                  key={row.id}
                  row={row}
                  showDivider={index < rows.length - 1}
                  onPress={() => router.push(row.route as never)}
                />
              ))}
          </SettingsSection>
        ))}
        <View style={[styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            row={{
              id: "logout",
              title: "Log out",
              section: "Information",
              iconKey: "logout",
              searchKeywords: [],
            }}
            danger
            showDivider={false}
            onPress={logout.open}
          />
        </View>
        </Animated.View>}
      </KeyboardAvoidingWrapper>
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
  content: { paddingTop: 0, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  titleContainer: { height: TITLE_BLOCK_HEIGHT, overflow: "hidden" },
  title: { fontSize: 34, lineHeight: SETTINGS_TITLE_LINE_HEIGHT },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.five,
    paddingLeft: Spacing.two,
  },
  profileCopy: { flex: 1, marginLeft: Spacing.three },
  logoutCard: { marginTop: Spacing.five, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: "hidden" },
});
