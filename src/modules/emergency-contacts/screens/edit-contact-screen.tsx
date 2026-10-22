import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Image, Text, TextInput, View } from "react-native";

import ContactAbstract from "@/assets/backgrounds/contact-abstract.svg";
import ProfilePlaceholder from "@/assets/icons/misc/profile-placeholder.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, validNationalMobile } from "@/shared/lib/input-formats";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { PageLayout } from "@/shared/ui/page-layout";
import { PhotoOptionsBottomSheet } from "@/shared/ui/photo-options-bottom-sheet";
import { CustomTextInput } from "@/shared/ui/text-input";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "./edit-contact-screen.styles";
import { RelationshipPicker } from "../components/relationship-picker";
import { deleteContact, updateContact } from "../services/contacts.api";

type ConfirmationType = "discard" | "delete" | null;

export function EditContactScreen() {
  const router = useRouter();
  const theme = useTheme();

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

  const [contactNameError, setContactNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConfirmation, setActiveConfirmation] =
    useState<ConfirmationType>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handlePhotoPress = () => {
    if (isLoading) return;
    setShowPhotoOptions(true);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission required",
        "Please allow camera access in your device settings to take a photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      setPhotoAsset(result.assets[0]);
    }
  };

  const handleChoosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo library permission required",
        "Please allow photo library access in your device settings.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      setPhotoAsset(result.assets[0]);
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
      setContactNameError("Please enter an emergency contact name.");
      isValid = false;
    }

    if (!trimmedPhone) {
      setPhoneNumberError("Please enter a phone number.");
      isValid = false;
    } else if (!validNationalMobile(trimmedPhone)) {
      setPhoneNumberError("Please enter a valid 10-digit mobile number.");
      isValid = false;
    }

    if (!relationship.trim()) {
      setRelationshipError("Please select a relationship.");
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
    const initialImage = initialProfileImage || null;

    return (
      contactName !== initialName ||
      phoneNumber !== initialPhone ||
      relationship !== initialRelationshipValue ||
      profileImage !== initialImage
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
    if (isLoading) return;
    if (hasChanges()) {
      setActiveConfirmation("discard");
      return;
    }
    resetForm();
  };

  const handleConfirmDiscard = () => {
    setActiveConfirmation(null);
    resetForm();
  };

  const handleCancelConfirmation = () => {
    setActiveConfirmation(null);
  };

  const handleSave = async () => {
    if (isLoading) return;
    if (!validateForm()) {
      if (!contactName.trim()) nameRef.current?.focus();
      else if (!validNationalMobile(phoneNumber)) phoneRef.current?.focus();
      return;
    }
    if (!contactId) return;

    try {
      setIsLoading(true);
      await updateContact(contactId, {
        name: contactName.trim(),
        phone: `+63${phoneNumber}`,
        relationship: relationship.trim(),
        photoAsset,
      });
      router.dismissTo({
        pathname: "/contact" as any,
        params: { notification: "success", message: "Saved successfully" },
      });
    } catch (error) {
      console.error("CONTACT UPDATE ERROR:", error);
      setNotificationMessage(error instanceof Error ? error.message : "Failed to save contact");
      setNotificationType("error");
      setShowNotification(true);
    } finally {
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
          <View style={styles.profileImage}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImagePreview}
              />
            ) : (
              <ProfilePlaceholder width={96} height={96} />
            )}
          </View>

          <Text
            style={[
              Typography.semibold,
              styles.contactName,
              { color: theme.text },
            ]}
          >
            {contactName || "Unnamed contact"}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.phoneNumber,
              { color: theme.text },
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
              color={BrandColors.error}
            />

            <Text
              style={[
                Typography.button,
                styles.deleteText,
                { color: BrandColors.error },
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
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImagePreview}
              />
            ) : (
              <ProfilePlaceholder width={96} height={96} />
            )}
          </Pressable>

          <Pressable
            onPress={handlePhotoPress}
            hitSlop={8}
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
          </Pressable>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label="Contact name"
            ref={nameRef}
            required
            value={contactName}
            error={contactNameError}
            onBlur={() => { if (!contactName.trim()) setContactNameError("Please enter an emergency contact name."); }}
            onChangeText={(text) => {
              setContactName(text);
              if (contactNameError) setContactNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Phone number"
            ref={phoneRef}
            required
            prefix="+63"
            keyboardType="phone-pad"
            value={phoneNumber}
            inputFormat={{ normalize: nationalMobile, format: formatNationalMobile }}
            error={phoneNumberError}
            onBlur={() => {
              if (phoneNumber && !validNationalMobile(phoneNumber)) setPhoneNumberError("Please enter a valid 10-digit mobile number.");
            }}
            onChangeText={handlePhoneChange}
            containerStyle={{ paddingBottom: Spacing.two }}
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

          <Pressable
            onPress={handleCancelEditing}
            disabled={isLoading}
            style={styles.cancelButton}
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
          </Pressable>
        </KeyboardHiddenView>
      </View>
    );
  };

  return (
    <PageLayout
      title={isEditing ? "Edit contact" : "Contact information"}
      scrollable
      contentFlush
      contentStyle={{ flexGrow: 1 }}
      rightAction={
        isEditing ? null : (
          <Pressable
            onPress={handleEditPress}
            disabled={isLoading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Edit emergency contact"
          >
            <Text
              style={[
                Typography.medium,
                styles.headerEdit,
                { color: theme.primary },
              ]}
            >
              Edit
            </Text>
          </Pressable>
        )
      }
    >
      <NotificationSheet
        visible={showNotification}
        message={notificationMessage}
        type={notificationType}
        onHide={() => setShowNotification(false)}
      />

      <View style={styles.pageContent}>
        <LinearGradient
          colors={["#FFFFFF", "#E5EDFC"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.pageBackground}
          pointerEvents="none"
        />

        <ContactAbstract
          width="100%"
          height="65%"
          style={styles.contactBackground}
          pointerEvents="none"
        />

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
          activeConfirmation === "delete" ? BrandColors.error : undefined
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

  return `+63${normalized}`;
}
