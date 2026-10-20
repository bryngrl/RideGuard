import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { ProfileCard } from "../../components/profile-card";
import { useProfile } from "../../hooks/use-profile";
import { useProfileFlip } from "../../hooks/use-profile-flip";
export function AccountScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, isLoading } = useProfile();
  const { progress, toggle } = useProfileFlip();
  return (
    <SettingsPageLayout
      title="Account"
      contentStyle={{ paddingTop: Spacing.five }}
      rightAction={
        <Pressable
          onPress={() => router.push("/settings/account/edit" as never)}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
          feedbackRadius={16}
          feedbackInsets={Spacing.one}
          feedbackBehindContent
          hitSlop={Spacing.one}
          accessibilityRole="button"
          accessibilityLabel="Edit account"
        >
          <Text style={[Typography.button, { color: colors.accent }]}>Edit</Text>
        </Pressable>
      }
    >
      {isLoading ? (
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      ) : (
        <ProfileCard profile={profile} progress={progress} onPress={toggle} />
      )}
    </SettingsPageLayout>
  );
}
