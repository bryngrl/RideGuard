import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { SweetAlert } from "@/components/ui/sweet-alert";
import { CustomTextInput } from "@/components/ui/text-input";
import {
  BrandColors,
  FontFamily,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");

  const { lastName, firstName, phone, updateProfile } = useAuthStore();

  const handleNextStep = () => {
    if (!lastName.trim()) {
      setAlertTitle("Missing Last Name");
      setAlertDescription("Please enter your last name.");
      setShowAlert(true);
      return;
    }

    if (!firstName.trim()) {
      setAlertTitle("Missing First Name");
      setAlertDescription("Please enter your first name.");
      setShowAlert(true);
      return;
    }

    if (!phone.trim()) {
      setAlertTitle("Missing Phone Number");
      setAlertDescription("Please enter your phone number.");
      setShowAlert(true);
      return;
    }

    if (!/^9\d{9}$/.test(phone)) {
      setAlertTitle("Invalid Phone Number");
      setAlertDescription(
        "Please enter a valid 10-digit Philippine mobile number.",
      );
      setShowAlert(true);
      return;
    }
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
            containerStyle={{ width: "50%" }}
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
            onChangeText={(text) => updateProfile({ lastName: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="First Name"
            required
            labelStyle={{ color: BrandColors.primary }}
            value={firstName}
            onChangeText={(text) => updateProfile({ firstName: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Phone Number"
            required
            labelStyle={{ color: BrandColors.primary }}
            keyboardType="phone-pad"
            value={phone}
            maxLength={10}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, "");
              updateProfile({ phone: digitsOnly });
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
            leftIcon={
              <Text
                style={[
                  Typography.input,
                  {
                    color: theme.textMuted,
                    fontFamily: FontFamily.geistSemiBold,
                  },
                ]}
              >
                +63
              </Text>
            }
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Next"
              variant="primary"
              size="md"
              fullWidth={false}
              style={{ width: "48%", alignSelf: "flex-start" }}
              onPress={handleNextStep}
            />
          </View>
        </View>
      </View>
      <SweetAlert
        visible={showAlert}
        type="warning"
        title={alertTitle}
        description={alertDescription}
        primaryButtonText="OK"
        onPrimaryPress={() => setShowAlert(false)}
        onClose={() => setShowAlert(false)}
      />
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
    marginTop: "auto",
    paddingTop: Spacing.three,
  },
});
