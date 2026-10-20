import { useAuthStore } from "@/modules/auth/store/auth.store";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { ConfirmationModal, CustomTextInput, ProfileAvatar } from "@/shared/ui";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable as NativePressable, StyleSheet, Text, View } from "react-native";
import { useAccountEdit } from "../../hooks/use-account-edit";
import { useProfile } from "../../hooks/use-profile";
import { uploadProfilePhoto } from "../../services/profile.api";

export function AccountEditScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, setPhotoUrl } = useProfile();
  const isDemo = useAuthStore((state) => state.isDemo);
  const edit = useAccountEdit(profile);
  const savedName = `${profile.firstName} ${profile.lastName}`.trim();
  const [confirm, setConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  useEffect(() => {
    setFullName(`${profile.firstName} ${profile.lastName}`.trim());
    setVehicleName(`${profile.vehicleBrand} ${profile.vehicleModel}`.trim());
  }, [profile.firstName, profile.lastName, profile.vehicleBrand, profile.vehicleModel]);
  const changeFullName = (value: string) => {
    setFullName(value);
    const trimmed = value.trim();
    const originalFirstName = profile.firstName.trim();
    const originalLastName = profile.lastName.trim();
    let firstName = "";
    let lastName = "";
    if (originalFirstName && trimmed.startsWith(`${originalFirstName} `)) {
      firstName = originalFirstName;
      lastName = trimmed.slice(originalFirstName.length).trim();
    } else if (originalLastName && trimmed.endsWith(` ${originalLastName}`)) {
      firstName = trimmed.slice(0, -originalLastName.length).trim();
      lastName = originalLastName;
    } else {
      const [firstWord = "", ...rest] = trimmed.split(/\s+/);
      firstName = firstWord;
      lastName = rest.join(" ");
    }
    edit.setField("firstName", firstName);
    edit.setField("lastName", lastName);
  };
  const changeVehicle = (value: string) => {
    setVehicleName(value);
    const trimmed = value.trim();
    const originalBrand = profile.vehicleBrand.trim();
    const originalModel = profile.vehicleModel.trim();
    let brand = "";
    let model = "";
    if (originalBrand && trimmed.startsWith(`${originalBrand} `)) {
      brand = originalBrand;
      model = trimmed.slice(originalBrand.length).trim();
    } else if (originalModel && trimmed.endsWith(` ${originalModel}`)) {
      brand = trimmed.slice(0, -originalModel.length).trim();
      model = originalModel;
    } else {
      const [firstWord = "", ...rest] = trimmed.split(/\s+/);
      brand = firstWord;
      model = rest.join(" ");
    }
    edit.setField("vehicleBrand", brand);
    edit.setField("vehicleModel", model);
  };
  const cancel = () => {
    if (edit.saving || uploading) return;
    edit.changed ? setConfirm(true) : router.back();
  };
  const save = async () => {
    if (await edit.save()) {
      Alert.alert("Account updated", "Your changes were saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };
  const changePhoto = async () => {
    if (uploading || edit.saving) return;
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
    <SettingsPageLayout title="Account" onBack={cancel} contentStyle={styles.content}>
      <View style={styles.profile}>
        <ProfileAvatar
          name={savedName || "R"}
          photoUrl={profile.photoUrl}
          size={80}
          textStyle={Typography.h2}
        />
        <View style={styles.profileCopy}>
          <Text style={[Typography.bodyLarge, styles.profileName, { color: colors.text }]}>
            {savedName || "Your name"}
          </Text>
          {!isDemo && (
            <NativePressable
              onPress={changePhoto}
              disabled={uploading || edit.saving}
              style={styles.photoLink}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              accessibilityState={{ disabled: uploading || edit.saving, busy: uploading }}
            >
              <Text style={[Typography.body, styles.linkText, { color: colors.accent }]}>
                {uploading ? "Uploading photo..." : "Change photo"}
              </Text>
            </NativePressable>
          )}
        </View>
      </View>

      <View style={styles.form}>
        <CustomTextInput
          label="Full name"
          required
          inputWrapperStyle={{ backgroundColor: colors.backgroundElement }}
          value={fullName}
          onChangeText={changeFullName}
          error={edit.submitted ? edit.fieldErrors.firstName || edit.fieldErrors.lastName : undefined}
          autoCapitalize="words"
        />
        <CustomTextInput
          label="Phone number"
          required
          inputWrapperStyle={{ backgroundColor: colors.backgroundElement }}
          prefix="+63"
          keyboardType="number-pad"
          maxLength={12}
          placeholder="9123456789"
          value={edit.form.phone}
          onChangeText={(value) => edit.setField("phone", value)}
          error={edit.submitted ? edit.fieldErrors.phone : undefined}
        />
        <CustomTextInput
          label="Email"
          required
          inputWrapperStyle={{ backgroundColor: colors.backgroundElement }}
          value={edit.form.email || "Managed by your sign-in provider"}
          editable={false}
        />
        <CustomTextInput
          label="Vehicle"
          required
          inputWrapperStyle={{ backgroundColor: colors.backgroundElement }}
          value={vehicleName}
          onChangeText={changeVehicle}
          error={edit.submitted ? edit.fieldErrors.vehicleBrand || edit.fieldErrors.vehicleModel : undefined}
        />
        <CustomTextInput
          label="Plate number"
          required
          inputWrapperStyle={{ backgroundColor: colors.backgroundElement }}
          value={edit.form.plateNumber}
          onChangeText={(value) => edit.setField("plateNumber", value)}
          error={edit.submitted ? edit.fieldErrors.plateNumber : undefined}
          autoCapitalize="characters"
        />
      </View>
      {edit.error && (
        <Text accessibilityLiveRegion="polite" style={[Typography.bodySmall, { color: colors.error }]}>
          {edit.error}
        </Text>
      )}
      <View style={styles.buttons}>
        <Pressable
          onPress={cancel}
          disabled={edit.saving || uploading}
          style={[styles.cancel, { borderColor: colors.primary }]}
          feedbackRadius={BorderRadius.full}
          accessibilityRole="button"
        >
          <Text style={[Typography.button, { color: colors.primary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={!edit.canSave || uploading}
          onPress={save}
          style={[styles.save, { backgroundColor: edit.canSave && !uploading ? colors.primary : colors.border }]}
          feedbackRadius={BorderRadius.full}
          accessibilityRole="button"
          accessibilityState={{ disabled: !edit.canSave || uploading, busy: edit.saving }}
        >
          <Text style={[Typography.button, { color: edit.canSave && !uploading ? colors.textInverse : colors.buttonMuted }]}>
            {edit.saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
      <ConfirmationModal
        visible={confirm}
        title="Discard changes?"
        description="Unsaved text edits will be lost. Profile picture changes are saved separately."
        primaryButtonText="Discard"
        secondaryButtonText="Keep editing"
        primaryButtonColor={colors.error}
        onPrimaryPress={() => {
          setConfirm(false);
          edit.reset();
          router.back();
        }}
        onSecondaryPress={() => setConfirm(false)}
      />
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Spacing.three },
  profile: {
    flexDirection: "row", alignItems: "center", gap: Spacing.four,
    paddingTop: Spacing.two, paddingLeft: Spacing.two, marginBottom: Spacing.five,
  },
  profileCopy: { alignItems: "flex-start", flex: 1 },
  profileName: { fontFamily: "Geist-SemiBold", fontSize: 18 },
  photoLink: { minHeight: 28, justifyContent: "center" },
  linkText: { fontFamily: "Geist-Medium" },
  form: { gap: Spacing.two, paddingHorizontal: Spacing.two },
  buttons: { flexDirection: "row", gap: Spacing.three, marginTop: "auto", paddingTop: Spacing.four, paddingHorizontal: Spacing.two },
  cancel: {
    flex: 1, minHeight: 48, borderWidth: 1, borderRadius: BorderRadius.full,
    alignItems: "center", justifyContent: "center",
  },
  save: {
    flex: 1, minHeight: 48, borderRadius: BorderRadius.full,
    alignItems: "center", justifyContent: "center",
  },
});
