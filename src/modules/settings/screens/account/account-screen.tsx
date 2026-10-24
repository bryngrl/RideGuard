import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ProfileCard } from "../../components/profile-card";
import { useProfile } from "../../hooks/use-profile";
import { useProfileFlip } from "../../hooks/use-profile-flip";
export function AccountScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, isLoading } = useProfile();
  const { progress, toggle } = useProfileFlip();
  const { notification, message } = useLocalSearchParams<{
    notification?: "success" | "error";
    message?: string;
  }>();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (notification && message) setShowNotification(true);
  }, [notification, message]);

  const handleNotificationHide = () => {
    setShowNotification(false);
    router.setParams({ notification: undefined, message: undefined });
  };

  return (
    <SettingsPageLayout
      title="Account"
      contentStyle={{ paddingTop: Spacing.five }}
      overlay={
        <NotificationSheet
          visible={showNotification}
          message={message ?? ""}
          type={notification === "error" ? "error" : "success"}
          onHide={handleNotificationHide}
        />
      }
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
        <View style={{ height: 148, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} accessibilityLabel="Loading account" />
        </View>
      ) : (
        <ProfileCard profile={profile} progress={progress} onPress={toggle} />
      )}
    </SettingsPageLayout>
  );
}
