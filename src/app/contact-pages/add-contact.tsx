import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import HelpIcon from "@/assets/icons/help-icon.svg";
import ProfilePlaceholder from "@/assets/icons/profile-placeholder.svg";

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { CustomTextInput } from "@/components/ui/text-input";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const RELATIONSHIPS = [
  { label: "Parent", value: "Parent" },
  { label: "Sibling", value: "Sibling" },
  { label: "Spouse", value: "Spouse" },
  { label: "Child", value: "Child" },
  { label: "Friend", value: "Friend" },
  { label: "Other", value: "Other" },
];

export default function AddContactScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("");

  const [contactNameError, setContactNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPhoto = () => {
    Alert.alert("Add photo", "Choose how you want to add a photo.", [
      {
        text: "Take photo",
        onPress: handleTakePhoto,
      },
      {
        text: "Choose from library",
        onPress: handleChoosePhoto,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
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

  const handleSave = async () => {
    if (isLoading) return;

    const isValid = validateForm();

    if (!isValid) return;

    const payload = {
      contact_name: contactName.trim(),
      emergency_phone_number: `+63${phoneNumber}`,
      relationship: relationship.trim(),
    };

    console.log("Emergency contact payload:", payload);

    try {
      setIsLoading(true);

      // TODO:
      // await createEmergencyContact(payload, firebaseToken);

      router.replace({
        pathname: "/contact",
        params: {
          notification: "success",
          message: "Saved successfully",
        },
      });
    } catch (error: any) {
      console.error("EMERGENCY CONTACT SUBMISSION ERROR:", error);

      Alert.alert(
        "Error",
        error?.message || "Failed to save emergency contact.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      contentStyle={{ flexGrow: 1 }}
      rightAction={
        <Pressable
          onPress={handleHelp}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Emergency contact information"
        >
          <HelpIcon width={20} height={20} />
        </Pressable>
      }
    >
      <View style={styles.container}>
        <View style={styles.photoSection}>
          <Pressable
            onPress={handleAddPhoto}
            style={styles.profileImage}
            accessibilityRole="button"
            accessibilityLabel="Add contact photo"
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
            onPress={handleAddPhoto}
            hitSlop={8}
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
          </Pressable>
        </View>
        <View style={styles.formContainer}>
          {/* Contact Name */}
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

          {/* Phone Number */}
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

          {/* Relationship */}
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
                    <Text style={[Typography.input, { color: theme.text }]}>
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
            onPress={() => {
              if (!isLoading) {
                router.back();
              }
            }}
            disabled={isLoading}
            style={styles.cancelButton}
          >
            <Text
              style={[
                Typography.bodySmall,
                styles.cancelText,
                { color: theme.text },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.five,
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

  addPhotoText: {
    marginTop: Spacing.two,
  },

  formContainer: {
    width: "100%",
  },

  pillInput: {
    borderRadius: 999,
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
    borderRadius: 999,
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },

  cancelText: {
    fontWeight: "600",
  },
});
