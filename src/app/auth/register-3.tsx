import MainLogo from "@/assets/icons/main-logo.svg";
import { Button } from "@/components/ui/button";

import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { SweetAlert } from "@/components/ui/sweet-alert";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ProfilePayload, submitProfile } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function RegisterStepThreeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [isSkipAlertVisible, setIsSkipAlertVisible] = useState(false);

  const [contactNameError, setContactNameError] = useState("");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

  const hasAnyInput = !!(
    store.contactName.trim() ||
    store.emergencyPhone.trim() ||
    store.relationship.trim()
  );

  const executeSubmission = async (
    validateEmergencyContact: boolean,
  ): Promise<boolean> => {
    setContactNameError("");
    setEmergencyPhoneError("");
    setRelationshipError("");

    const payload: ProfilePayload = {
      first_name: store.firstName.trim(),
      last_name: store.lastName.trim(),
      phone_number: `+63${store.phone.trim().replace(/^0/, "")}`,
      vehicle: store.vehicleName.trim(),
      plate_number: store.plateNumber.trim(),
      color: store.color.trim(),
    };

    // Only validate emergency contact when the user has chosen
    // to submit emergency contact information.
    if (validateEmergencyContact) {
      let isValid = true;

      if (!store.contactName.trim()) {
        setContactNameError("Please enter an emergency contact name.");
        isValid = false;
      }

      if (!store.emergencyPhone.trim()) {
        setEmergencyPhoneError("Please enter a phone number.");
        isValid = false;
      } else if (!/^9\d{9}$/.test(store.emergencyPhone.trim())) {
        setEmergencyPhoneError("Please enter a valid 10-digit mobile number.");
        isValid = false;
      }

      if (!store.relationship.trim()) {
        setRelationshipError("Please select a relationship.");
        isValid = false;
      }

      if (!isValid) {
        return false;
      }

      // Only add emergency contact fields after validation succeeds.
      payload.contact_name = store.contactName.trim();

      payload.emergency_phone_number = `+63${store.emergencyPhone
        .trim()
        .replace(/^0/, "")}`;

      payload.relationship = store.relationship.trim();
    }

    console.log("Payload:", payload);

    try {
      setIsLoading(true);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Auth Error",
          "You must be signed in to complete registration.",
        );

        return false;
      }

      const firebaseToken = await user.getIdToken();

      await submitProfile(payload, firebaseToken);

      return true;
    } catch (error: any) {
      console.error("PROFILE SUBMISSION ERROR:", error);

      Alert.alert("Error", error.message || "Failed to submit profile.");

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const success = await executeSubmission(true);

    if (success) {
      router.replace("/permission");
    }
  };
  const handleSkipPress = () => {
    if (!isLoading) {
      setIsSkipAlertVisible(true);
    }
  };

  const handleSkipAnyway = async () => {
    setIsSkipAlertVisible(false);

    const success = await executeSubmission(false);

    if (success) {
      router.replace("/permission");
    }
  };

  const handleAddContact = async () => {
    setIsSkipAlertVisible(false);
    await executeSubmission(true);
  };

  return (
    <>
      <KeyboardAvoidingWrapper>
        <View style={styles.container}>
          <View style={styles.stepperContainer}>
            <Stepper
              currentStep={3}
              steps={3}
              size={28}
              containerStyle={{ width: "70%" }}
            />
          </View>

          <View style={styles.logoContainer}>
            <MainLogo width={64} height={64} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[Typography.largeTitle, { color: theme.text }]}>
              Emergency Contact
            </Text>
            <Text
              style={[
                Typography.body,
                { color: theme.textMuted, marginTop: Spacing.three },
              ]}
            >
              They'll get an SOS text with your location if you trigger an alert
              or if an attack is detected.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomTextInput
              label="Contact Name"
              required
              value={store.contactName}
              error={contactNameError}
              onChangeText={(text) => {
                store.updateProfile({ contactName: text });
                if (contactNameError) setContactNameError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
            />

            <CustomTextInput
              label="Phone Number"
              required
              prefix="+63"
              keyboardType="phone-pad"
              value={store.emergencyPhone}
              error={emergencyPhoneError}
              maxLength={10}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, "");
                const formattedPhone = digitsOnly.replace(/^0+/, "");

                store.updateProfile({ emergencyPhone: formattedPhone });
                if (emergencyPhoneError) setEmergencyPhoneError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
            />

            <View style={styles.relationshipDropdown}>
              <Pressable onPress={() => setIsRelationshipOpen((prev) => !prev)}>
                <View pointerEvents="none">
                  <CustomTextInput
                    label="Relationship"
                    required
                    value={store.relationship}
                    error={relationshipError}
                    placeholder="Select relationship"
                    editable={false}
                    rightIcon={
                      <Ionicons
                        name={isRelationshipOpen ? "caret-up" : "caret-down"}
                        size={20}
                        color={theme.textMuted}
                      />
                    }
                    containerStyle={{ paddingBottom: 0 }}
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
                  {[
                    { label: "Parent", value: "Parent" },
                    { label: "Sibling", value: "Sibling" },
                    { label: "Spouse", value: "Spouse" },
                    { label: "Child", value: "Child" },
                    { label: "Friend", value: "Friend" },
                    { label: "Other", value: "Other" },
                  ].map((item) => (
                    <Pressable
                      key={item.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        store.updateProfile({
                          relationship: item.value,
                        });
                        if (relationshipError) setRelationshipError(""); // Clear error when selected
                        setIsRelationshipOpen(false);
                      }}
                    >
                      <Text style={[Typography.input, { color: theme.text }]}>
                        {item.label}
                      </Text>

                      {store.relationship === item.value && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={BrandColors.primary}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Back"
                variant="ghost"
                fullWidth={false}
                leftIcon={
                  <Ionicons name="chevron-back" size={16} color={theme.text} />
                }
                textStyle={{ color: theme.text }}
                onPress={() => router.back()}
                style={{ width: "48%" }}
              />

              <Button
                title={hasAnyInput ? "Submit" : "Skip"}
                variant={hasAnyInput ? "primary" : "primary"}
                size="md"
                fullWidth={false}
                isLoading={isLoading}
                style={{ width: "48%" }}
                onPress={hasAnyInput ? handleSubmit : handleSkipPress}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingWrapper>

      <SweetAlert
        visible={isSkipAlertVisible}
        type="warning"
        title="Skip emergency contact?"
        description="You can add one anytime in Settings, but SOS alerts won't reach anyone personal until you do."
        primaryButtonText="Add now"
        secondaryButtonText="Skip anyway"
        primaryButtonVariant="primary"
        secondaryButtonVariant="ghost"
        onPrimaryPress={handleAddContact}
        onSecondaryPress={handleSkipAnyway}
        onClose={handleAddContact}
        closeOnBackdropPress={!isLoading}
        isLoading={isLoading}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepperContainer: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.three,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  formContainer: {
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: Spacing.two,
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
});
