import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { lastName, firstName, phone, updateProfile } = useAuthStore();

  const handleNextStep = () => {
    if (!lastName.trim() || !firstName.trim() || !phone.trim()) {
      Alert.alert("Missing Fields", "Please fill out all profile information.");
      return;
    }
    router.push("/auth/register-2");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={1} steps={3} size={28} containerStyle={{ width: "70%" }} />
        </View>

        <View style={styles.logoContainer}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.headerContainer}>
          <Text style={[Typography.largeTitle, { color: theme.text }]}>Your Profile</Text>
          <Text style={[Typography.body, { color: theme.textMuted, marginTop: Spacing.half }]}>
            Let's get started.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label="Last Name"
            labelStyle={{ color: BrandColors.primary }}
            value={lastName}
            onChangeText={(text) => updateProfile({ lastName: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="First Name"
            labelStyle={{ color: BrandColors.primary }}
            value={firstName}
            onChangeText={(text) => updateProfile({ firstName: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Phone Number"
            labelStyle={{ color: BrandColors.primary }}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => updateProfile({ phone: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
            leftIcon={<Text style={[Typography.input, { color: theme.textMuted, fontWeight: "600" }]}>+63</Text>}
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
    width: 80,
    height: 80,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.four,
    paddingLeft: Spacing.two,
  },
  formContainer: {
    marginBottom: Spacing.five,
    paddingLeft: Spacing.two,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.three,
  },
});
