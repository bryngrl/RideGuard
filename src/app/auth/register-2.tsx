import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";

export default function RegisterStepTwoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { vehicleName, plateNumber, color, updateProfile } = useAuthStore();

  const handleNextStep = () => {
    if (!vehicleName.trim() || !plateNumber.trim()) {
      Alert.alert("Missing Fields", "Please enter your vehicle name and plate number.");
      return;
    }
    router.push("/auth/register-3");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={2} steps={3} size={28} containerStyle={{ width: "70%" }} />
        </View>

        <View style={styles.logoContainer}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.headerContainer}>
          <Text style={[Typography.largeTitle, { color: theme.text }]}>Your Vehicle</Text>
          <Text style={[Typography.body, { color: theme.textMuted, marginTop: Spacing.half }]}>
            What will you be driving?
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label="Vehicle Name"
            labelStyle={{ color: BrandColors.primary }}
            value={vehicleName}
            onChangeText={(text) => updateProfile({ vehicleName: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Plate Number"
            labelStyle={{ color: BrandColors.primary }}
            value={plateNumber}
            onChangeText={(text) => updateProfile({ plateNumber: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Color (Optional)"
            labelStyle={{ color: BrandColors.primary }}
            value={color}
            onChangeText={(text) => updateProfile({ color: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
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
