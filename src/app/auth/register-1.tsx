import MainLogo from "@/assets/icons/main-logo.svg";
import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { lastName, firstName, phone, updateProfile } = useAuthStore();
  const [lastNameError, setLastNameError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

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
    } else if (!/^9\d{9}$/.test(phone)) {
      setPhoneError("Please enter a valid 10-digit Philippine mobile number.");
      isValid = false;
    }
    if (!isValid) return;
    router.push("/auth/register-2");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper
            currentStep={1}
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
            label="Last Name"
            required
            labelStyle={{ color: BrandColors.primary }}
            value={lastName}
            error={lastNameError}
            onChangeText={(text) => {
              updateProfile({ lastName: text });
              if (lastNameError) setLastNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="First Name"
            required
            labelStyle={{ color: BrandColors.primary }}
            value={firstName}
            error={firstNameError}
            onChangeText={(text) => {
              updateProfile({ firstName: text });
              if (firstNameError) setFirstNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Phone Number"
            required
            prefix="+63"
            labelStyle={{ color: BrandColors.primary }}
            keyboardType="phone-pad"
            value={phone}
            error={phoneError}
            maxLength={10}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, "");
              const formattedPhone = digitsOnly.replace(/^0+/, "");

              updateProfile({ phone: formattedPhone });

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
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  formContainer: {
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.three,
    alignItems: "flex-end",
  },
});
