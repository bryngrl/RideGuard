import { BrandedAlert as Alert } from "@/shared/lib/branded-alert";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, plateInput } from "@/shared/lib/input-formats";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { ConfirmationModal, CustomTextInput, ProfileAvatar } from "@/shared/ui";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { PhotoOptionsBottomSheet } from "@/shared/ui/photo-options-bottom-sheet";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Pressable as NativePressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAccountEdit } from "../../hooks/use-account-edit";
import { useProfile } from "../../hooks/use-profile";
import { uploadProfilePhoto } from "../../services/profile.api";

export function AccountEditScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile, isLoading, setPhotoUrl } = useProfile();
  const isDemo = useAuthStore((state) => state.isDemo);
  const edit = useAccountEdit(profile);
  const savedName = `${profile.firstName} ${profile.lastName}`.trim();
  const [confirm, setConfirm] = useState(false);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const pickingPhotoRef = useRef(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const savingRef = useRef(false);
  const [fullName, setFullName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [touched, setTouched] = useState({ phone: false, plate: false });
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const vehicleRef = useRef<TextInput>(null);
  const plateRef = useRef<TextInput>(null);
  useEffect(() => {
    if (edit.changed) return;
    setFullName(`${profile.firstName} ${profile.lastName}`.trim());
    setVehicleName(`${profile.vehicleBrand} ${profile.vehicleModel}`.trim());
  }, [edit.changed, profile.firstName, profile.lastName, profile.vehicleBrand, profile.vehicleModel]);
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
  const leaveAccount = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/settings/account");
  };
  const cancel = () => {
    if (savingRef.current || pickingPhotoRef.current) return;
    edit.changed || photoAsset ? setConfirm(true) : leaveAccount();
  };
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      cancel();
      return true;
    });
    return () => subscription.remove();
  }, [edit.changed, photoAsset, pickingPhoto, router]));
  const save = async () => {
    if (savingRef.current || pickingPhotoRef.current || showPhotoOptions || (!edit.changed && !photoAsset)) return;
    savingRef.current = true;
    try {
      if (edit.changed && !(await edit.save())) {
        if (!edit.valid) {
          (edit.fieldErrors.firstName || edit.fieldErrors.lastName ? nameRef : edit.fieldErrors.phone ? phoneRef : edit.fieldErrors.vehicleBrand || edit.fieldErrors.vehicleModel ? vehicleRef : plateRef).current?.focus();
        }
        return;
      }
      if (photoAsset) {
        setSavingPhoto(true);
        const uploaded = await uploadProfilePhoto(photoAsset);
        setPhotoUrl(uploaded.photo_url);
        setPhotoAsset(null);
      }
      router.dismissTo({
        pathname: "/settings/account" as any,
        params: {
          notification: "success",
          message: photoAsset ? "Photo saved successfully" : "Account updated successfully",
        },
      });
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      savingRef.current = false;
      setSavingPhoto(false);
    }
  };
  const changePhoto = () => {
    if (showPhotoOptions || pickingPhotoRef.current || savingRef.current) return;
    setShowPhotoOptions(true);
  };
  const pickPhoto = async (source: "camera" | "gallery") => {
    if (pickingPhotoRef.current || savingRef.current) return;
    pickingPhotoRef.current = true;
    setPickingPhoto(true);
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          source === "camera" ? "Camera permission required" : "Photo library permission required",
          source === "camera" ? "Allow camera access to take a photo." : "Allow photo library access to choose a photo.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open settings", onPress: () => { void Linking.openSettings(); } },
          ],
        );
        return;
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      };
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]?.uri) setPhotoAsset(result.assets[0]);
    } catch (error) {
      Alert.alert(source === "camera" ? "Could not take photo" : "Could not choose photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      pickingPhotoRef.current = false;
      setPickingPhoto(false);
    }
  };

  const canSave = (edit.changed || photoAsset !== null) && !edit.saving && !savingPhoto && !pickingPhoto;

  if (isLoading) return (
    <SettingsPageLayout title="Account" onBack={cancel} contentStyle={styles.content}>
      <View style={{ height: 148, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Loading account" />
      </View>
    </SettingsPageLayout>
  );

  return (
    <SettingsPageLayout title="Account" onBack={cancel} contentStyle={styles.content}>
      <View style={styles.profile}>
        <ProfileAvatar
          name={savedName || "R"}
          photoUrl={photoAsset?.uri ?? profile.photoUrl}
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
              disabled={pickingPhoto || savingPhoto || edit.saving}
              style={({ pressed }) => [styles.photoLink, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              accessibilityState={{ disabled: pickingPhoto || savingPhoto || edit.saving, busy: pickingPhoto }}
            >
              <Text style={[Typography.body, styles.linkText, { color: colors.accent }]}>
                {pickingPhoto ? "Choosing photo..." : "Change photo"}
              </Text>
            </NativePressable>
          )}
        </View>
      </View>

      <View style={styles.form}>
        <CustomTextInput
          ref={nameRef}
          label="Full name"
          required
          value={fullName}
          onChangeText={changeFullName}
          error={edit.submitted ? edit.fieldErrors.firstName || edit.fieldErrors.lastName : undefined}
          autoCapitalize="words"
        />
        <CustomTextInput
          ref={phoneRef}
          label="Phone number"
          required
          prefix="+63"
          keyboardType="number-pad"
          placeholder="9XX XXX XXXX"
          value={edit.form.phone}
          inputFormat={{ normalize: nationalMobile, format: formatNationalMobile }}
          onChangeText={(value) => edit.setField("phone", value)}
          error={edit.submitted || touched.phone ? edit.fieldErrors.phone : undefined}
          onBlur={() => setTouched((state) => ({ ...state, phone: true }))}
        />
        <CustomTextInput
          label="Email"
          required
          value={edit.form.email || "Managed by your sign-in provider"}
          editable={false}
        />
        <CustomTextInput
          ref={vehicleRef}
          label="Vehicle"
          required
          value={vehicleName}
          onChangeText={changeVehicle}
          error={edit.submitted ? edit.fieldErrors.vehicleBrand || edit.fieldErrors.vehicleModel : undefined}
        />
        <CustomTextInput
          ref={plateRef}
          label="Plate number"
          required
          value={edit.form.plateNumber}
          onChangeText={(value) => edit.setField("plateNumber", plateInput(value))}
          error={edit.submitted || touched.plate ? edit.fieldErrors.plateNumber : undefined}
          onBlur={() => setTouched((state) => ({ ...state, plate: true }))}
          autoCapitalize="characters"
        />
      </View>
      {edit.error && (
        <Text accessibilityLiveRegion="polite" style={[Typography.bodySmall, { color: colors.error }]}>
          {edit.error}
        </Text>
      )}
      <KeyboardHiddenView style={styles.buttons}>
        <Pressable
          disabled={!canSave}
          onPress={save}
          style={[styles.save, { backgroundColor: canSave ? colors.primary : colors.border }]}
          feedbackRadius={BorderRadius.full}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: edit.saving || savingPhoto }}
        >
          <Text style={[Typography.button, { color: canSave ? colors.textInverse : colors.buttonMuted }]}>
            {edit.saving || savingPhoto ? "Saving..." : "Save"}
          </Text>
        </Pressable>
        <Pressable
          onPress={cancel}
          disabled={edit.saving || savingPhoto || pickingPhoto}
          style={[styles.cancel, { borderColor: colors.primary }]}
          feedbackRadius={BorderRadius.full}
          accessibilityRole="button"
        >
          <Text style={[Typography.button, { color: colors.primary }]}>Cancel</Text>
        </Pressable>
      </KeyboardHiddenView>
      <ConfirmationModal
        visible={confirm}
        title="Discard changes?"
        description="Your unsaved changes, including the selected photo, will be lost."
        primaryButtonText="Discard"
        secondaryButtonText="Keep editing"
        primaryButtonColor={colors.error}
        onPrimaryPress={() => {
          setConfirm(false);
          edit.reset();
          setPhotoAsset(null);
          leaveAccount();
        }}
        onSecondaryPress={() => setConfirm(false)}
      />
      <PhotoOptionsBottomSheet
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onTakePhoto={() => { void pickPhoto("camera"); }}
        onChoosePhoto={() => { void pickPhoto("gallery"); }}
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
  buttons: { flexDirection: "column", gap: Spacing.two, marginTop: "auto", paddingTop: Spacing.four, paddingHorizontal: Spacing.two },
  cancel: {
    width: "100%", minHeight: 48, borderWidth: 1, borderRadius: BorderRadius.full,
    alignItems: "center", justifyContent: "center",
  },
  save: {
    width: "100%", minHeight: 48, borderRadius: BorderRadius.full,
    alignItems: "center", justifyContent: "center",
  },
});
