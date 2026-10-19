import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { ProfileCard } from "../../components/profile-card";
import { useProfile } from "../../hooks/use-profile";
import { useProfileFlip } from "../../hooks/use-profile-flip";
import { uploadProfilePhoto } from "../../services/profile.api";
export function AccountScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, isLoading, setPhotoUrl } = useProfile();
  const isDemo = useAuthStore((state) => state.isDemo);
  const [uploading, setUploading] = useState(false);
  const { progress, toggle } = useProfileFlip();
  const changePhoto = async () => {
    if (uploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access required", "Allow photo library access to upload a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const uploaded = await uploadProfilePhoto(result.assets[0]);
      setPhotoUrl(uploaded.photo_url);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  };
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
        <View>
          <ProfileCard profile={profile} progress={progress} onPress={toggle} />
          {!isDemo && <Pressable onPress={changePhoto} disabled={uploading} accessibilityRole="button"
            style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: colors.primary }}>
              {uploading ? "Uploading photo..." : "Change profile photo"}
            </Text>
          </Pressable>}
        </View>
      )}
    </PageLayout>
  );
}
