import MainLogo from "@/assets/icons//logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import Stepper from "@/shared/ui/stepper";
import { CustomTextInput } from "@/shared/ui/text-input";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useOnboardingStore } from "../store/onboarding.store";
import { styles } from "./vehicle-step-screen.styles";

export default function RegisterStepTwoScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { vehicleBrand, vehicleModel, plateNumber, color, updateDraft } =
    useOnboardingStore();

  const [vehicleBrandError, setVehicleBrandError] = useState("");
  const [vehicleModelError, setVehicleModelError] = useState("");
  const [plateNumberError, setPlateNumberError] = useState("");

  const handleNextStep = () => {
    setVehicleBrandError("");
    setVehicleModelError("");
    setPlateNumberError("");

    let isValid = true;

    if (!vehicleBrand.trim()) {
      setVehicleBrandError("Please enter your vehicle brand.");
      isValid = false;
    }

    if (!vehicleModel.trim()) {
      setVehicleModelError("Please enter your vehicle model.");
      isValid = false;
    }

    if (!plateNumber.trim()) {
      setPlateNumberError("Please enter your plate number.");
      isValid = false;
    }

    if (!isValid) return;

    router.push("/(onboarding)/register/emergency-contact");
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
          <MainLogo width={64} height={64} />
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
            label="Vehicle Brand"
            required
            value={vehicleBrand}
            error={vehicleBrandError}
            onChangeText={(text) => {
              updateDraft({ vehicleBrand: text });
              if (vehicleBrandError) setVehicleBrandError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Vehicle Model"
            required
            value={vehicleModel}
            error={vehicleModelError}
            onChangeText={(text) => {
              updateDraft({ vehicleModel: text });
              if (vehicleModelError) setVehicleModelError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Plate Number"
            required
            value={plateNumber}
            error={plateNumberError}
            onChangeText={(text) => {
              updateDraft({ plateNumber: text });
              if (plateNumberError) setPlateNumberError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Color"
            value={color}
            onChangeText={(text) => {
              updateDraft({ color: text });
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Back"
              variant="ghost"
              fullWidth={false}
              centerTextWithLeftIcon
              leftIcon={
                <Ionicons name="chevron-back" size={16} color={theme.text} />
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
              style={{ width: "48%" }}
              onPress={handleNextStep}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}
