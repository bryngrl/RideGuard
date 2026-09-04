import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { SweetAlert } from "@/components/ui/sweet-alert";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { submitProfile } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function RegisterStepThreeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [isSkipAlertVisible, setIsSkipAlertVisible] = useState(false);
  const [isSkippedAlertVisible, setIsSkippedAlertVisible] = useState(false);

  const [contactNameError, setContactNameError] = useState("");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

  const hasAnyInput = !!(
    store.contactName.trim() ||
    store.emergencyPhone.trim() ||
    store.relationship.trim()
  );

  const executeSubmission = async (
    includeEmergencyContact: boolean,
  ): Promise<boolean> => {
    setContactNameError("");
    setEmergencyPhoneError("");
    setRelationshipError("");

    const payload: any = {
      first_name: store.firstName.trim(),
      last_name: store.lastName.trim(),
      phone_number: `+63${store.phone.trim().replace(/^0/, "")}`,
      vehicle: store.vehicleName.trim(),
      plate_number: store.plateNumber.trim(),
    };

    if (includeEmergencyContact) {
      let isValid = true;

      if (!store.contactName.trim()) {
        setContactNameError("Please enter an emergency contact name.");
        isValid = false;
      }

      if (!store.emergencyPhone.trim()) {
        setEmergencyPhoneError("Please enter a phone number.");
        isValid = false;
      } else if (!/^9\d{9}$/.test(store.emergencyPhone)) {
        setEmergencyPhoneError("Please enter a valid 10-digit mobile number.");
        isValid = false;
      }

      if (!store.relationship.trim()) {
        setRelationshipError("Please select a relationship.");
        isValid = false;
      }

      if (!isValid) return false;

      payload.contact_name = store.contactName.trim();
      payload.emergency_phone_number = `+63${store.emergencyPhone
        .trim()
        .replace(/^0/, "")}`;
      payload.relationship = store.relationship.trim();
    }

    console.log("Payload:", payload);

    try {
      setIsLoading(true);
      console.log("Getting Firebase Auth...");

      const auth = getAuth();
      const user = auth.currentUser;

      console.log("Current Firebase User:", user?.uid);

      if (!user) {
        console.log("ERROR: No authenticated user found");
        Alert.alert(
          "Auth Error",
          "You must be signed in to complete registration.",
        );
        return false;
      }

      const firebaseToken = await user.getIdToken();
      const response = await submitProfile(payload, firebaseToken);

      store.resetForm();

      return true;
    } catch (error: any) {
      console.error("PROFILE SUBMISSION ERROR:", error);
      Alert.alert("Error", error.message || "Failed to submit profile.");
      return false;
    } finally {
      setIsLoading(false);
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
      setIsSkippedAlertVisible(true);
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
            <Image
              source={require("@/assets/images/Primary-Icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
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
              keyboardType="phone-pad"
              value={store.emergencyPhone}
              error={emergencyPhoneError}
              maxLength={10}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, "");
                store.updateProfile({ emergencyPhone: digitsOnly });
                if (emergencyPhoneError) setEmergencyPhoneError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
              leftIcon={
                <Text
                  style={[
                    Typography.input,
                    { color: theme.textMuted, fontWeight: "600" },
                  ]}
                >
                  +63
                </Text>
              }
            />

            <View style={styles.relationshipDropdown}>
              <Pressable onPress={() => setIsRelationshipOpen((prev) => !prev)}>
                <View pointerEvents="none">
                  <CustomTextInput
                    label="Relationship"
                    value={store.relationship}
                    error={relationshipError}
                    placeholder="Select relationship"
                    editable={false}
                    rightIcon={
                      <Ionicons
                        name={
                          isRelationshipOpen
                            ? "chevron-up-outline"
                            : "chevron-down-outline"
                        }
                        size={22}
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
                  <Ionicons name="chevron-back" size={24} color={theme.text} />
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
                onPress={
                  hasAnyInput ? () => executeSubmission(true) : handleSkipPress
                }
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingWrapper>

      <SweetAlert
        visible={isSkipAlertVisible}
        type="warning"
        title="Skip emergency contact?"
        description="They'll get an SOS text with your location if you trigger an alert or if an attack is detected."
        primaryButtonText="Add now"
        secondaryButtonText="Skip now"
        primaryButtonVariant="primary"
        secondaryButtonVariant="ghost"
        onPrimaryPress={handleAddContact}
        onSecondaryPress={handleSkipAnyway}
        onClose={handleAddContact}
        closeOnBackdropPress={!isLoading}
        isLoading={isLoading}
      />
      <SweetAlert
        visible={isSkippedAlertVisible}
        type="success"
        title="Emergency contact skipped"
        description="You can add an emergency contact later from your account settings."
        primaryButtonText="Continue"
        onPrimaryPress={() => {
          setIsSkippedAlertVisible(false);
          router.replace("/permission");
        }}
        onClose={() => {
          setIsSkippedAlertVisible(false);
          router.replace("/permission");
        }}
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
    paddingTop: Spacing.three,
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
