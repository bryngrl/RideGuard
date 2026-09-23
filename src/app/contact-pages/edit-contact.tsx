import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import ProfilePlaceholder from "@/assets/icons/profile-placeholder.svg";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { NotificationSheet } from "@/components/ui/notification-sheet";
import { PhotoOptionsBottomSheet } from "@/components/ui/photo-options-bottom-sheet";
import { PageLayout } from "@/components/ui/page-layout";
import { CustomTextInput } from "@/components/ui/text-input";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const RELATIONSHIPS = [
  {
    label: "Parent",
    value: "Parent",
  },
  {
    label: "Sibling",
    value: "Sibling",
  },
  {
    label: "Spouse",
    value: "Spouse",
  },
  {
    label: "Child",
    value: "Child",
  },
  {
    label: "Friend",
    value: "Friend",
  },
  {
    label: "Other",
    value: "Other",
  },
];

type ConfirmationType = "discard" | "delete" | null;

export default function EditContactScreen() {
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

  const [profileImage, setProfileImage] = useState<string | null>(
    initialProfileImage || null,
  );

  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

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
    if (isLoading) {
      return;
    }

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
    }
  };

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "");

    const formattedPhone = digitsOnly.replace(/^0+/, "");

    const limitedPhone = formattedPhone.slice(0, 10);

    setPhoneNumber(limitedPhone);

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
    } else if (!/^9\d{9}$/.test(trimmedPhone)) {
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
    if (isLoading) {
      return;
    }

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

    setContactNameError("");
    setPhoneNumberError("");
    setRelationshipError("");

    setIsRelationshipOpen(false);
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    if (isLoading) {
      return;
    }

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
    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const updatedContact = {
        id: contactId ?? "",
        name: contactName.trim(),
        phoneNumber: formatPhoneNumber(phoneNumber),
        relationship: relationship.trim(),
        profileImage: profileImage ?? "",
      };

      console.log("DEMO UPDATED CONTACT:", updatedContact);

      setIsEditing(false);
      setIsRelationshipOpen(false);

      setNotificationMessage("Changed saved successfully");
      setNotificationType("success");
      setShowNotification(true);
    } catch (error) {
      console.error("CONTACT UPDATE ERROR:", error);

      setNotificationMessage("Failed to save contact");
      setNotificationType("error");
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePress = () => {
    if (isLoading) {
      return;
    }

    setActiveConfirmation("delete");
  };

  const handleConfirmDelete = () => {
    if (isLoading) {
      return;
    }

    setActiveConfirmation(null);
    setIsLoading(true);
    // TODO: Backend Endpoint
    router.replace({
      pathname: "/contact",
      params: {
        notification: "success",
        message: "Deleted successfully",
        deletedContactId: contactId ?? "",
      },
    });
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
              {
                color: theme.text,
              },
            ]}
          >
            {contactName || "Unnamed contact"}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.phoneNumber,
              {
                color: theme.text,
              },
            ]}
          >
            {formatPhoneNumber(phoneNumber)}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.relationship,
              {
                color: theme.textMuted,
              },
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
                Typography.bodySmall,
                styles.deleteText,
                {
                  color: BrandColors.error,
                },
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
        {/* PHOTO */}
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
                {
                  color: theme.accent,
                },
              ]}
            >
              {profileImage ? "Change photo" : "Add new photo"}
            </Text>
          </Pressable>
        </View>

        {/* FORM */}
        <View style={styles.formContainer}>
          <CustomTextInput
            label="Contact name"
            required
            value={contactName}
            error={contactNameError}
            inputWrapperStyle={styles.pillInput}
            onChangeText={(text) => {
              setContactName(text);

              if (contactNameError) {
                setContactNameError("");
              }
            }}
            containerStyle={{
              paddingBottom: Spacing.two,
            }}
          />

          <CustomTextInput
            label="Phone number"
            required
            prefix="+63"
            prefixStyle={{
              color: theme.textMuted,
              fontWeight: "400",
            }}
            keyboardType="phone-pad"
            value={phoneNumber}
            error={phoneNumberError}
            maxLength={10}
            inputWrapperStyle={styles.pillInput}
            onChangeText={handlePhoneChange}
            containerStyle={{
              paddingBottom: Spacing.two,
            }}
          />

          {/* RELATIONSHIP */}
          <View style={styles.relationshipDropdown}>
            <Pressable
              onPress={() => setIsRelationshipOpen((previous) => !previous)}
            >
              <View pointerEvents="none">
                <CustomTextInput
                  label="Relationship"
                  required
                  value={relationship}
                  error={relationshipError}
                  editable={false}
                  inputWrapperStyle={styles.pillInput}
                  rightIcon={
                    <Ionicons
                      name={
                        isRelationshipOpen
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={20}
                      color={theme.textMuted}
                    />
                  }
                  containerStyle={{
                    paddingBottom: 0,
                  }}
                />
              </View>
            </Pressable>

            {isRelationshipOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                {RELATIONSHIPS.map((item) => (
                  <Pressable
                    key={item.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRelationship(item.value);
                      setIsRelationshipOpen(false);

                      if (relationshipError) {
                        setRelationshipError("");
                      }
                    }}
                  >
                    <Text
                      style={[
                        Typography.input,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {relationship === item.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.primary}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
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
                Typography.bodySmall,
                styles.cancelText,
                {
                  color: theme.text,
                },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <PageLayout
      title={isEditing ? "Edit contact" : "Contact information"}
      scrollable
      contentFlush
      contentStyle={{
        flexGrow: 1,
      }}
      rightAction={
        isEditing ? (
          <Pressable
            onPress={handleCancelEditing}
            disabled={isLoading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text
              style={[
                Typography.bodySmall,
                styles.headerCancel,
                {
                  color: theme.primary,
                },
              ]}
            ></Text>
          </Pressable>
        ) : (
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
                {
                  color: theme.primary,
                },
              ]}
            >
              Edit
            </Text>
          </Pressable>
        )
      }
    >
      {/* NOTIFICATION */}
      <NotificationSheet
        visible={showNotification}
        message={notificationMessage}
        type={notificationType}
        onHide={() => {
          setShowNotification(false);
        }}
      />

      {/* PAGE CONTENT */}
      <View style={styles.pageContent}>
        {isEditing ? renderEditForm() : renderPreview()}
      </View>

      {/* DISCARD / DELETE CONFIRMATION */}
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
const styles = StyleSheet.create({
  pageContent: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  previewContainer: {
    flex: 1,
    width: "100%",
  },

  profileSection: {
    alignItems: "center",
  },

  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  profileImagePreview: {
    width: "100%",
    height: "100%",
  },

  contactName: {
    marginTop: Spacing.four,
    fontWeight: "700",
  },

  phoneNumber: {
    marginTop: Spacing.one,
  },

  relationship: {
    marginTop: Spacing.one,
  },

  deleteContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Spacing.four,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },

  deleteText: {
    fontWeight: "600",
  },
  editContainer: {
    flex: 1,
    width: "100%",
  },

  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },

  addPhotoText: {
    marginTop: Spacing.two,
  },

  formContainer: {
    width: "100%",
  },

  pillInput: {
    borderRadius: BorderRadius.full,
  },

  relationshipDropdown: {
    position: "relative",
    zIndex: 10,
    paddingBottom: Spacing.two,
  },

  dropdownMenu: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    marginTop: -Spacing.one,
  },

  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },

  actions: {
    marginTop: "auto",
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },

  saveButton: {
    borderRadius: BorderRadius.full,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },

  cancelText: {
    fontWeight: "600",
  },
  headerEdit: {
    fontWeight: "600",
  },
  headerCancel: {
    fontWeight: "600",
  },
});
