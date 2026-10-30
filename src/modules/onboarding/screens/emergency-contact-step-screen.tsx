import MainLogo from "@/assets/icons//logos/main.svg";
import { Button } from "@/shared/ui/button";
import { styles } from "./emergency-contact-step-screen.styles";

import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, validNationalMobile } from "@/shared/lib/input-formats";
import { Spacing, Typography } from "@/shared/theme";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import Stepper from "@/shared/ui/stepper";
import { SweetAlert } from "@/shared/ui/sweet-alert";
import { CustomTextInput } from "@/shared/ui/text-input";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { FormDropdown } from "@/shared/ui/form-dropdown";
import { useRouter } from "expo-router";
import { APIError } from "@/shared/api/errors";
import { useRef, useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import { ProfilePayload } from "../services/onboarding.api";
import { saveOnboardingDetails } from "../services/save-onboarding-details";
import { useOnboardingStore } from "../store/onboarding.store";

export default function RegisterStepThreeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const store = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [isSkipAlertVisible, setIsSkipAlertVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const submitting = useRef(false);
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

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
    if (submitting.current) return false;
    setSaveError(null);
    setContactNameError("");
    setEmergencyPhoneError("");
    setRelationshipError("");

    if (!store.firstName.trim() || !store.lastName.trim() || !validNationalMobile(store.phone)) {
      router.replace("/(onboarding)/register/profile");
      return false;
    }
    if (!store.vehicleBrand.trim() || !store.vehicleModel.trim() || !store.plateNumber.trim() || !store.color.trim()) {
      router.replace("/(onboarding)/register/vehicle");
      return false;
    }

    const payload: ProfilePayload = {
      first_name: store.firstName.trim(),
      last_name: store.lastName.trim(),
      phone_number: `+63${store.phone.trim().replace(/^0/, "")}`,
      brand: store.vehicleBrand.trim(),
      model: store.vehicleModel.trim(),
      plate_number: store.plateNumber.trim(),
      color: store.color.trim(),
    };

    // Only validate emergency contact when the user has chosen
    // to submit emergency contact information.
    if (validateEmergencyContact) {
      let isValid = true;

      if (!store.contactName.trim()) {
        setContactNameError("Enter the contact name.");
        isValid = false;
      }

      if (!store.emergencyPhone.trim()) {
        setEmergencyPhoneError("Enter a phone number.");
        isValid = false;
      } else if (!validNationalMobile(store.emergencyPhone.trim())) {
        setEmergencyPhoneError("Enter a valid 10-digit mobile number.");
        isValid = false;
      }

      if (!store.relationship.trim()) {
        setRelationshipError("Select a relationship.");
        isValid = false;
      }

      if (!isValid) {
        if (!store.contactName.trim()) nameRef.current?.focus();
        else if (!validNationalMobile(store.emergencyPhone)) phoneRef.current?.focus();
        else { Keyboard.dismiss(); setIsRelationshipOpen(true); }
        return false;
      }

      // Only add emergency contact fields after validation succeeds.
      payload.contact_name = store.contactName.trim();

      payload.emergency_phone_number = `+63${store.emergencyPhone
        .trim()
        .replace(/^0/, "")}`;

      payload.relationship = store.relationship.trim();
    }

    try {
      submitting.current = true;
      Keyboard.dismiss();
      setIsLoading(true);

      await saveOnboardingDetails(payload, validateEmergencyContact);

      return true;
    } catch (error: unknown) {
      setSaveError(
        error instanceof APIError && error.status === 422
          ? "Profile already exists. Contact support to save these details."
          : "Couldn't save details. Try again.",
      );

      return false;
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const success = await executeSubmission(true);

    if (success) {
      router.push("/(onboarding)/register/permission");
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
      router.push("/(onboarding)/register/permission");
    }
  };

  const handleAddContact = async () => {
    setIsSkipAlertVisible(false);
    nameRef.current?.focus();
  };

  return (
    <>
      <KeyboardAvoidingWrapper>
        <View style={styles.container}>
          <View style={styles.stepperContainer}>
            <Stepper currentStep={3} steps={10} size={4} />
          </View>

          <View style={styles.logoContainer}>
            <MainLogo color={theme.logo} width={64} height={64} />
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
            {saveError ? <FormFeedback message={saveError} /> : null}
            <CustomTextInput
              ref={nameRef}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              label="Contact Name"
              required
              value={store.contactName}
              error={contactNameError}
              onChangeText={(text) => {
                store.updateDraft({ contactName: text });
                if (contactNameError) setContactNameError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
            />

            <CustomTextInput
              ref={phoneRef}
              label="Phone Number"
              required
              prefix="+63"
              keyboardType="phone-pad"
              placeholder="9XX XXX XXXX"
              value={store.emergencyPhone}
              inputFormat={{ normalize: nationalMobile, format: formatNationalMobile }}
              error={emergencyPhoneError}
              onBlur={() => {
                if (store.emergencyPhone && !validNationalMobile(store.emergencyPhone)) setEmergencyPhoneError("Enter a valid 10-digit mobile number.");
              }}
              onChangeText={(text) => {
                store.updateDraft({ emergencyPhone: text });
                if (emergencyPhoneError) setEmergencyPhoneError("");
              }}
              containerStyle={{ paddingBottom: Spacing.two }}
            />

            <FormDropdown label="Relationship" required value={store.relationship}
              error={relationshipError} placeholder="Select relationship" disabled={isLoading}
              open={isRelationshipOpen} onOpenChange={setIsRelationshipOpen}
              options={[
                "Parent", "Sibling", "Spouse", "Partner", "Child", "Friend", "Colleague", "Mentor", "Student", "Other",
              ].map((value) => ({ label: value, value }))}
              onChange={(relationship) => {
                store.updateDraft({ relationship });
                setRelationshipError("");
              }} />

            <KeyboardHiddenView style={styles.buttonContainer}>
              <Button
                title="Back"
                variant="ghost"
                fullWidth={false}
                feedbackEnabled={false}
                leftIcon={
                  <BackArrowIcon color={theme.text} />
                }
                textStyle={{ color: theme.text }}
                onPress={() => router.canGoBack() ? router.back() : router.replace("/(onboarding)/register/vehicle")}
                disabled={isLoading}
                style={{ flex: 1, paddingHorizontal: 0, justifyContent: "flex-start" }}
              />
              <Button title={hasAnyInput ? "Next" : "Skip"} variant="primary" size="md"
                fullWidth={false} isLoading={isLoading} style={{ flex: 1 }}
                onPress={hasAnyInput ? handleSubmit : handleSkipPress} />
            </KeyboardHiddenView>
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
