import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { CustomTextInput } from "@/components/ui/text-input";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function RegisterStepTwoScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { vehicleName, plateNumber, color, updateProfile } = useAuthStore();

  const [vehicleNameError, setVehicleNameError] = useState("");
  const [plateNumberError, setPlateNumberError] = useState("");
  const [colorError, setColorError] = useState("");

  const handleNextStep = () => {
    setVehicleNameError("");
    setPlateNumberError("");
    setColorError("");

    let isValid = true;

    if (!vehicleName.trim()) {
      setVehicleNameError("Please enter your vehicle name.");
      isValid = false;
    }

    if (!plateNumber.trim()) {
      setPlateNumberError("Please enter your plate number.");
      isValid = false;
    }

    if (!color.trim()) {
      setColorError("Please enter your vehicle color.");
      isValid = false;
    }
    if (!isValid) return;

    router.push("/auth/register-3");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper
            currentStep={2}
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
            Your Vehicle
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
            label="Vehicle Name"
            value={vehicleName}
            error={vehicleNameError}
            onChangeText={(text) => {
              updateProfile({ vehicleName: text });
              if (vehicleNameError) setVehicleNameError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Plate Number"
            value={plateNumber}
            error={plateNumberError}
            onChangeText={(text) => {
              updateProfile({ plateNumber: text });
              if (plateNumberError) setPlateNumberError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Color"
            value={color}
            error={colorError}
            onChangeText={(text) => {
              updateProfile({ color: text });
              if (colorError) setColorError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

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
    alignItems: "center",
    marginTop: "auto",
    paddingTop: Spacing.three,
  },
});
