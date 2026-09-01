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

  const executeSubmission = async (includeEmergencyContact: boolean) => {
    console.log("=== STARTING PROFILE SUBMISSION ===");
    console.log("Include emergency contact:", includeEmergencyContact);

    const payload: any = {
      first_name: store.firstName.trim(),
      last_name: store.lastName.trim(),
      phone_number: `+63${store.phone.trim().replace(/^0/, "")}`,
      vehicle: store.vehicleName.trim(),
      plate_number: store.plateNumber.trim(),
    };

    if (includeEmergencyContact) {
      if (
        !store.contactName.trim() ||
        !store.emergencyPhone.trim() ||
        !store.relationship.trim()
      ) {
        Alert.alert(
          "Missing Info",
          "Please fill out all emergency contact fields or press Skip.",
        );
        return;
      }

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
        return;
      }
      const firebaseToken = await user.getIdToken();
      const response = await submitProfile(payload, firebaseToken);
      store.resetForm();

      console.log("Redirecting to dashboard...");
      // redirect
      // router.replace("/(tabs)");
    } catch (error: any) {
      console.error("PROFILE SUBMISSION ERROR:", error);

      Alert.alert("Error", error.message || "Failed to submit profile.");
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
    console.log("User chose to skip emergency contact");
    setIsSkipAlertVisible(false);
    await executeSubmission(false);
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
              labelStyle={{ color: BrandColors.primary }}
              value={store.contactName}
              onChangeText={(text) =>
                store.updateProfile({ contactName: text })
              }
              containerStyle={{ paddingBottom: Spacing.two }}
            />

            <CustomTextInput
              label="Phone Number"
              labelStyle={{ color: BrandColors.primary }}
              keyboardType="phone-pad"
              value={store.emergencyPhone}
              maxLength={10}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, "");
                store.updateProfile({ emergencyPhone: digitsOnly });
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

            {/* rs dropdown */}
            <View style={styles.relationshipDropdown}>
              <Pressable onPress={() => setIsRelationshipOpen((prev) => !prev)}>
                <View pointerEvents="none">
                  <CustomTextInput
                    label="Relationship"
                    labelStyle={{ color: BrandColors.primary }}
                    value={store.relationship}
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

                        setIsRelationshipOpen(false);
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
                title="Skip"
                variant="primary"
                size="md"
                fullWidth={false}
                isLoading={isLoading}
                style={{
                  width: "48%",
                  alignSelf: "flex-start",
                }}
                onPress={handleSkipPress}
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
