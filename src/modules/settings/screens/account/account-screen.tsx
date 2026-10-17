import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { ProfileCard } from "../../components/profile-card";
import { useProfile } from "../../hooks/use-profile";
import { useProfileFlip } from "../../hooks/use-profile-flip";
export function AccountScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, isLoading } = useProfile();
  const { progress, toggle } = useProfileFlip();
  return (
    <PageLayout
      title="Account"
      rightAction={
        <Pressable
          onPress={() => router.push("/settings/account/edit" as never)}
        >
          <Text style={[Typography.button, { color: colors.primary }]}>Edit</Text>
        </Pressable>
      }
    >
      {isLoading ? (
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      ) : (
        <ProfileCard profile={profile} progress={progress} onPress={toggle} />
      )}
    </PageLayout>
  );
}
