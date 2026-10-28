import { BrandedAlert as Alert } from "@/shared/lib/branded-alert";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { BackHandler, Linking, Pressable as NativePressable, Text, TextInput, View } from "react-native";

import { Image } from "expo-image";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import ContactAbstract from "@/assets/backgrounds/contact-abstract.svg";
import ProfilePlaceholder from "@/assets/icons/misc/profile-placeholder.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, validNationalMobile } from "@/shared/lib/input-formats";
import { actionFooterPadding, Spacing, Typography } from "@/shared/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/shared/ui/button";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { PageLayout } from "@/shared/ui/page-layout";
import { PhotoOptionsBottomSheet } from "@/shared/ui/photo-options-bottom-sheet";
import { CustomTextInput } from "@/shared/ui/text-input";
import { CachedPhoto } from "@/shared/ui/cached-photo";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "./edit-contact-screen.styles";
import { RelationshipPicker } from "../components/relationship-picker";
import { deleteContact, updateContact } from "../services/contacts.api";

type ConfirmationType = "discard" | "delete" | null;

export function EditContactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const { bottom } = useSafeAreaInsets();

  const {
    contactId,
    contactName: initialContactName,
    phoneNumber: initialPhoneNumber,
    relationship: initialRelationship,
    profileImage: initialProfileImage,
  } = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    phoneNumber?: string;
    relationship?: string;
    profileImage?: string;
  }>();

  const [isEditing, setIsEditing] = useState(false);
  const [contactName, setContactName] = useState(initialContactName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    normalizePhoneNumber(initialPhoneNumber ?? ""),
  );
  const [relationship, setRelationship] = useState(initialRelationship ?? "");
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const [profileImage, setProfileImage] = useState<string | null>(
    initialProfileImage || null,
  );
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const pickingPhotoRef = useRef(false);
  const savingRef = useRef(false);

  const [contactNameError, setContactNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConfirmation, setActiveConfirmation] =
    useState<ConfirmationType>(null);
  const [discardLeaving, setDiscardLeaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handlePhotoPress = () => {
    if (isLoading || pickingPhotoRef.current || showPhotoOptions) return;
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
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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

  const handleEditPress = () => {
    if (isLoading) return;
    setIsEditing(true);
  };

  const hasChanges = () => {
    const initialName = initialContactName ?? "";
    const initialPhone = normalizePhoneNumber(initialPhoneNumber ?? "");
    const initialRelationshipValue = initialRelationship ?? "";
    return (
      contactName.trim() !== initialName.trim() ||
      phoneNumber !== initialPhone ||
      relationship.trim() !== initialRelationshipValue.trim() ||
      photoAsset !== null
    );
  };

  const resetForm = () => {
    setContactName(initialContactName ?? "");
    setPhoneNumber(normalizePhoneNumber(initialPhoneNumber ?? ""));
    setRelationship(initialRelationship ?? "");
    setProfileImage(initialProfileImage || null);
    setPhotoAsset(null);
    setContactNameError("");
    setPhoneNumberError("");
    setRelationshipError("");
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    if (isLoading || pickingPhoto) return;
    if (hasChanges()) {
      setDiscardLeaving(false);
      setActiveConfirmation("discard");
      return;
    }
    resetForm();
  };

  const handleConfirmDiscard = () => {
    setActiveConfirmation(null);
    resetForm();
    if (discardLeaving) leaveContact();
    setDiscardLeaving(false);
  };

  const handleCancelConfirmation = () => {
    setActiveConfirmation(null);
    setDiscardLeaving(false);
  };

  const leaveContact = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/contact");
  };

  const handleBack = () => {
    if (savingRef.current || pickingPhoto) return;
    if (isEditing && hasChanges()) {
      setDiscardLeaving(true);
      setActiveConfirmation("discard");
      return;
    }
    leaveContact();
  };
  useFocusEffect(useCallback(() => {
    if (!contactId) {
      router.replace("/contact");
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [contactId, contactName, phoneNumber, relationship, photoAsset, isEditing, pickingPhoto, router]));

  const handleSave = async () => {
    if (savingRef.current || pickingPhoto || !hasChanges()) return;
    if (!validateForm()) {
      if (!contactName.trim()) nameRef.current?.focus();
      else if (!validNationalMobile(phoneNumber)) phoneRef.current?.focus();
      return;
    }
    if (!contactId) return;

    try {
      savingRef.current = true;
      setIsLoading(true);
      await updateContact(contactId, {
        name: contactName.trim(),
        phone: `+63${phoneNumber}`,
        relationship: relationship.trim(),
        photoAsset,
      });
      router.dismissTo({
        pathname: "/contact" as any,
        params: { notification: "success", message: "Contact updated successfully" },
      });
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : "Failed to save contact");
      setNotificationType("error");
      setShowNotification(true);
    } finally {
      savingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleDeletePress = () => {
    if (isLoading) return;
    setActiveConfirmation("delete");
  };

  const handleConfirmDelete = async () => {
    if (isLoading) return;
    setActiveConfirmation(null);
    if (!contactId) return;
    setIsLoading(true);
    try {
      await deleteContact(contactId);
      router.dismissTo({
        pathname: "/contact" as any,
        params: { notification: "success", message: "Deleted successfully" },
      });
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : "Failed to delete contact");
      setNotificationType("error");
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.profileSection}>
          <View style={[styles.profileImage, styles.previewImage]}>
            {profileImage ? (
              <CachedPhoto uri={profileImage} style={styles.profileImagePreview}
                placeholder={<ProfilePlaceholder color={theme.contactIllustration} width={120} height={120} />} />
            ) : (
              <ProfilePlaceholder color={theme.contactIllustration} width={120} height={120} />
            )}
          </View>

          <Text
            style={[
              Typography.semibold,
              styles.contactName,
              { color: theme.logo },
            ]}
          >
            {contactName || "Unnamed contact"}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.phoneNumber,
              { color: theme.logo },
            ]}
          >
            {formatPhoneNumber(phoneNumber)}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.relationship,
              { color: theme.textMuted },
            ]}
          >
            {relationship || "No relationship"}
          </Text>
        </View>

        <View style={styles.deleteContainer}>
          <Pressable
            onPress={handleDeletePress}
            disabled={isLoading}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete emergency contact"
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={theme.critical}
            />

            <Text
              style={[
                Typography.button,
                styles.deleteText,
                { color: theme.critical },
              ]}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderEditForm = () => {
    return (
      <View style={styles.editContainer}>
        <View style={styles.photoSection}>
          <Pressable
            onPress={handlePhotoPress}
            style={styles.profileImage}
            accessibilityRole="button"
            accessibilityLabel={
              profileImage ? "Change contact photo" : "Add contact photo"
            }
          >
            {profileImage ? (
              <CachedPhoto uri={profileImage} style={styles.profileImagePreview}
                placeholder={<ProfilePlaceholder color={theme.contactIllustration} width={112} height={112} />} />
            ) : (
              <ProfilePlaceholder color={theme.contactIllustration} width={112} height={112} />
            )}
          </Pressable>

          <NativePressable
            onPress={handlePhotoPress}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityRole="button"
            accessibilityLabel={
              profileImage ? "Change contact photo" : "Add contact photo"
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
              if (contactNameError) setContactNameError("");
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
            disabled={!hasChanges() || pickingPhoto || isLoading}
            onPress={handleSave}
            style={styles.saveButton}
          />

          <NativePressable
            onPress={handleCancelEditing}
            disabled={isLoading}
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
    );
  };

  return (
    <PageLayout
      title={isEditing ? "Edit contact" : "Contact information"}
      onBack={handleBack}
      scrollable
      contentFlush
      contentStyle={{ flexGrow: 1 }}
      overlay={
        <NotificationSheet
          visible={showNotification}
          message={notificationMessage}
          type={notificationType}
          onHide={() => setShowNotification(false)}
        />
      }
      rightAction={
        isEditing ? null : (
          <Pressable
            onPress={handleEditPress}
            disabled={isLoading}
            style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
            feedbackRadius={16}
            feedbackInsets={Spacing.one}
            feedbackBehindContent
            hitSlop={Spacing.one}
            accessibilityRole="button"
            accessibilityLabel="Edit emergency contact"
          >
            <Text style={[Typography.button, { color: theme.accent }]}>Edit</Text>
          </Pressable>
        )
      }
    >
      <View style={[styles.pageContent, isEditing ? styles.editPageContent : styles.previewPageContent,
        isEditing && { paddingBottom: actionFooterPadding(bottom) - Spacing.two }]}>
        <LinearGradient
          colors={isDark ? [theme.background, theme.background] : [theme.contactPageStart, theme.contactPageEnd]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.pageBackground}
          pointerEvents="none"
        />

        {isDark ? <View style={styles.pageBackground} pointerEvents="none">
          <Image
          source={require("@/assets/images/backgrounds/contact-information-dark.png")}
          style={styles.darkContactBackground}
          contentFit="contain"
          pointerEvents="none"
          accessible={false}
          />
        </View> : <ContactAbstract
          width="100%"
          height="65%"
          style={styles.contactBackground}
          pointerEvents="none"
        />}

        <View style={styles.pageContentForeground}>
          {isEditing ? renderEditForm() : renderPreview()}
        </View>
      </View>

      <ConfirmationModal
        visible={activeConfirmation !== null}
        title={
          activeConfirmation === "discard"
            ? "Discard changes?"
            : "Delete contact?"
        }
        description={
          activeConfirmation === "discard"
            ? "You have unsaved changes. Are you sure you want to discard them?"
            : "This emergency contact will be deleted and they won't be notified if you trigger an SOS or emergency alert."
        }
        primaryButtonText={
          activeConfirmation === "discard" ? "Discard" : "Delete"
        }
        secondaryButtonText="Cancel"
        onPrimaryPress={
          activeConfirmation === "discard"
            ? handleConfirmDiscard
            : handleConfirmDelete
        }
        onSecondaryPress={handleCancelConfirmation}
        primaryButtonColor={
          activeConfirmation === "delete" ? theme.error : undefined
        }
      />

      <PhotoOptionsBottomSheet
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
      />
    </PageLayout>
  );
}

function normalizePhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("63")) {
    return digits.slice(2).slice(-10);
  }

  if (digits.startsWith("0")) {
    return digits.slice(1).slice(-10);
  }

  return digits.slice(-10);
}

function formatPhoneNumber(phone: string) {
  const normalized = normalizePhoneNumber(phone);

  if (normalized.length !== 10) {
    return phone;
  }

  const local = `0${normalized}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
