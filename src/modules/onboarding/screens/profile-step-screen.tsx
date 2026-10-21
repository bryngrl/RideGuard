import MainLogo from "@/assets/icons//logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatNationalMobile, nationalMobile, validNationalMobile } from "@/shared/lib/input-formats";
import { BrandColors, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import Stepper from "@/shared/ui/stepper";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useOnboardingStore } from "../store/onboarding.store";
import { styles } from "./profile-step-screen.styles";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { lastName, firstName, phone, updateDraft } = useOnboardingStore();
  const [lastNameError, setLastNameError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const lastNameRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const handleNextStep = () => {
    setLastNameError("");
    setFirstNameError("");
    setPhoneError("");

    let isValid = true;

    if (!lastName.trim()) {
      setLastNameError("Please enter your last name.");
      isValid = false;
    }

    if (!firstName.trim()) {
      setFirstNameError("Please enter your first name.");
      isValid = false;
    }

    if (!phone.trim()) {
      setPhoneError("Please enter your phone number.");
      isValid = false;
    } else if (!validNationalMobile(phone)) {
      setPhoneError("Please enter a valid 10-digit Philippine mobile number.");
      isValid = false;
    }
    if (!isValid) {
      (!lastName.trim() ? lastNameRef : !firstName.trim() ? firstNameRef : phoneRef).current?.focus();
      return;
    }
    router.push("/(onboarding)/register/vehicle");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={1} steps={10} size={6} />
        </View>

        <View style={styles.logoContainer}>
          <MainLogo width={64} height={64} />
        </View>

        <View style={styles.headerContainer}>
          <Text style={[Typography.largeTitle, { color: theme.text }]}>
            Your Profile
          </Text>
          <Text
            style={[
              Typography.body,
              { color: theme.textMuted, marginTop: Spacing.three },
            ]}
          >
            Let's get started.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            ref={lastNameRef}
            label="Last Name"
            required
            labelStyle={{ color: BrandColors.primary }}
            value={lastName}
            error={lastNameError}
            onBlur={() => { if (!lastName.trim()) setLastNameError("Please enter your last name."); }}
            onChangeText={(text) => {
              updateDraft({ lastName: text });
              if (lastNameError) setLastNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            ref={firstNameRef}
            label="First Name"
            required
            labelStyle={{ color: BrandColors.primary }}
            value={firstName}
            error={firstNameError}
            onBlur={() => { if (!firstName.trim()) setFirstNameError("Please enter your first name."); }}
            onChangeText={(text) => {
              updateDraft({ firstName: text });
              if (firstNameError) setFirstNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            ref={phoneRef}
            label="Phone Number"
            required
            prefix="+63"
            labelStyle={{ color: BrandColors.primary }}
            keyboardType="phone-pad"
            value={phone}
            inputFormat={{ normalize: nationalMobile, format: formatNationalMobile }}
            error={phoneError}
            onBlur={() => {
              if (!phone) setPhoneError("Please enter your phone number.");
              else if (!validNationalMobile(phone)) setPhoneError("Please enter a valid 10-digit Philippine mobile number.");
            }}
            onChangeText={(text) => {
              updateDraft({ phone: text });

              if (phoneError) setPhoneError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Next"
              variant="primary"
              size="md"
              fullWidth={false}
              style={{ width: "48%" }}
              onPress={handleNextStep}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}
