import { BrandedAlert as Alert } from "@/shared/lib/branded-alert";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { BackHandler, Keyboard, Linking, Pressable as NativePressable, Text, TextInput, View } from "react-native";

import HelpIcon from "@/assets/icons/actions/help.svg";
import ProfilePlaceholder from "@/assets/icons/misc/profile-placeholder.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, validNationalMobile } from "@/shared/lib/input-formats";
import { actionFooterPadding, Typography } from "@/shared/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/shared/ui/button";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import { PageLayout } from "@/shared/ui/page-layout";
import { PhotoOptionsBottomSheet } from "@/shared/ui/photo-options-bottom-sheet";
import { CustomTextInput } from "@/shared/ui/text-input";
import { CachedPhoto } from "@/shared/ui/cached-photo";
import { createContact, listContacts } from "../services/contacts.api";
import { RelationshipPicker } from "../components/relationship-picker";
import { styles } from "./add-contact-screen.styles";

export function AddContactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const [contactNameError, setContactNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const savingRef = useRef(false);
  const pickingPhotoRef = useRef(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handleAddPhoto = () => {
    if (showPhotoOptions || pickingPhotoRef.current || savingRef.current) return;
    setShowPhotoOptions(true);
  };

  const handleTakePhoto = async () => {
    if (pickingPhotoRef.current || savingRef.current) return;
    pickingPhotoRef.current = true;
    setPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera permission required", "Allow camera access to take a photo.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => { void Linking.openSettings(); } },
        ]);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfileImage(result.assets[0].uri);
        setPhotoAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Could not take photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      pickingPhotoRef.current = false;
      setPickingPhoto(false);
    }
  };

  const handleChoosePhoto = async () => {
    if (pickingPhotoRef.current || savingRef.current) return;
    pickingPhotoRef.current = true;
    setPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photo library permission required", "Allow photo library access to choose a photo.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => { void Linking.openSettings(); } },
        ]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfileImage(result.assets[0].uri);
        setPhotoAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Could not choose photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      pickingPhotoRef.current = false;
      setPickingPhoto(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);

    if (phoneNumberError) {
      setPhoneNumberError("");
    }
  };

  const validateForm = () => {
    let isValid = true;

    setContactNameError("");
    setPhoneNumberError("");
    setRelationshipError("");

    const trimmedName = contactName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setContactNameError("Enter the contact name.");
      isValid = false;
    }

    if (!trimmedPhone) {
      setPhoneNumberError("Enter a phone number.");
      isValid = false;
    } else if (!validNationalMobile(trimmedPhone)) {
      setPhoneNumberError("Enter a valid 10-digit mobile number.");
      isValid = false;
    }

    if (!relationship.trim()) {
      setRelationshipError("Select a relationship.");
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (savingRef.current || pickingPhotoRef.current || showPhotoOptions) return;

    const isValid = validateForm();

    if (!isValid) {
      if (!contactName.trim()) nameRef.current?.focus();
      else if (!validNationalMobile(phoneNumber)) phoneRef.current?.focus();
      return;
    }

    try {
      savingRef.current = true;
      setIsLoading(true);
      Keyboard.dismiss();
      const existing = await listContacts();
      if (existing.length >= 5) throw new Error("Maximum of five contacts allowed.");
      await createContact({
        name: contactName.trim(),
        phone: `+63${phoneNumber}`,
        relationship: relationship.trim(),
        photoAsset,
      });
      router.dismissTo({
        pathname: "/contact" as any,
        params: {
          notification: "success",
          message: "Contact added successfully",
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save emergency contact.",
      );
    } finally {
      savingRef.current = false;
      setIsLoading(false);
    }
  };

  const leaveContact = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/contact");
  };

  const handleCancel = () => {
    if (savingRef.current || pickingPhotoRef.current) return;
    if (contactName.trim() || phoneNumber || relationship || photoAsset) {
      Alert.alert("Discard changes?", "Your new contact has not been saved.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: leaveContact },
      ]);
      return;
    }
    leaveContact();
  };

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleCancel();
      return true;
    });
    return () => subscription.remove();
  }, [contactName, phoneNumber, relationship, photoAsset, router]));

  const handleHelp = () => {
    Alert.alert(
      "Emergency contacts",
      "Emergency contacts will receive notifications when an SOS alert is triggered.",
    );
  };

  return (
    <PageLayout
      title="New contact"
      scrollable
      contentFlush
      contentStyle={{ flexGrow: 1 }}
      onBack={handleCancel}
      rightAction={
        <Pressable
          onPress={handleHelp}
          feedbackRadius={10}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Emergency contact information"
        >
          <HelpIcon width={20} height={20} />
        </Pressable>
      }
    >
      <View style={[styles.container, { paddingBottom: actionFooterPadding(bottom) }]}>
        <View style={styles.photoSection}>
          <Pressable
            onPress={handleAddPhoto}
            style={styles.profileImage}
            accessibilityRole="button"
            accessibilityLabel="Add contact photo"
          >
            {profileImage ? (
              <CachedPhoto uri={profileImage} style={styles.profileImagePreview}
                placeholder={<ProfilePlaceholder width={96} height={96} />} />
            ) : (
              <ProfilePlaceholder width={96} height={96} />
            )}
          </Pressable>

          <NativePressable
            onPress={handleAddPhoto}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityRole="button"
            accessibilityLabel={
              profileImage ? "Change contact photo" : "Add new photo"
            }
          >
            <Text
              style={[
                Typography.medium,
                styles.addPhotoText,
                { color: theme.accent },
              ]}
            >
              {profileImage ? "Change photo" : "Add new photo"}
            </Text>
          </NativePressable>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label="Contact name"
            ref={nameRef}
            required
            value={contactName}
            error={contactNameError}
            onBlur={() => { if (!contactName.trim()) setContactNameError("Enter the contact name."); }}
            onChangeText={(text) => {
              setContactName(text);

              if (contactNameError) {
                setContactNameError("");
              }
            }}
          />

          <CustomTextInput
            label="Phone number"
            ref={phoneRef}
            required
            prefix="+63"
            keyboardType="phone-pad"
            placeholder="9XX XXX XXXX"
            value={phoneNumber}
            inputFormat={{ normalize: nationalMobile, format: formatNationalMobile }}
            error={phoneNumberError}
            onBlur={() => {
              if (phoneNumber && !validNationalMobile(phoneNumber)) setPhoneNumberError("Enter a valid 10-digit mobile number.");
            }}
            onChangeText={handlePhoneChange}
          />

          <RelationshipPicker
            value={relationship}
            error={relationshipError}
            onChange={(value) => {
              setRelationship(value);
              setRelationshipError("");
            }}
          />
        </View>

        <KeyboardHiddenView style={styles.actions}>
          <Button
            title="Save"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            onPress={handleSave}
            style={styles.saveButton}
          />

          <NativePressable
            onPress={handleCancel}
            disabled={isLoading || pickingPhoto}
            style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[
                Typography.button,
                styles.cancelText,
                { color: theme.text },
              ]}
            >
              Cancel
            </Text>
          </NativePressable>
        </KeyboardHiddenView>
      </View>

      <PhotoOptionsBottomSheet
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
      />
    </PageLayout>
  );
}
