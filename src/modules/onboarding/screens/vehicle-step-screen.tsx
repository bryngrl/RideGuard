import MainLogo from "@/assets/icons//logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { plateInput, validPlateInput } from "@/shared/lib/input-formats";
import { Spacing, Typography } from "@/shared/theme";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { Button } from "@/shared/ui/button";
import { KeyboardAvoidingWrapper } from "@/shared/ui/keyboard-avoiding-wrapper";
import { KeyboardHiddenView } from "@/shared/ui/keyboard-hidden-view";
import Stepper from "@/shared/ui/stepper";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
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
  const [colorError, setColorError] = useState("");
  const brandRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const plateRef = useRef<TextInput>(null);
  const colorRef = useRef<TextInput>(null);

  const handleNextStep = () => {
    setVehicleBrandError("");
    setVehicleModelError("");
    setPlateNumberError("");
    setColorError("");

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
    } else if (!validPlateInput(plateNumber)) {
      setPlateNumberError("Enter a valid vehicle plate number.");
      isValid = false;
    }

    if (!color.trim()) {
      setColorError("Please enter your vehicle color.");
      isValid = false;
    }

    if (!isValid) {
      (!vehicleBrand.trim() ? brandRef : !vehicleModel.trim() ? modelRef : !plateNumber.trim() || !validPlateInput(plateNumber) ? plateRef : colorRef).current?.focus();
      return;
    }

    router.push("/(onboarding)/register/emergency-contact");
  };

  return (
    <KeyboardAvoidingWrapper>
      <View style={styles.container}>
        <View style={styles.stepperContainer}>
          <Stepper currentStep={2} steps={10} size={6} />
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
            ref={brandRef}
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
            ref={modelRef}
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
            ref={plateRef}
            label="Plate Number"
            required
            autoCapitalize="characters"
            value={plateNumber}
            error={plateNumberError}
            onBlur={() => {
              if (plateNumber && !validPlateInput(plateNumber)) setPlateNumberError("Enter a valid vehicle plate number.");
            }}
            onChangeText={(text) => {
              updateDraft({ plateNumber: plateInput(text) });
              if (plateNumberError) setPlateNumberError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            ref={colorRef}
            label="Color"
            required
            value={color}
            error={colorError}
            onChangeText={(text) => {
              updateDraft({ color: text });
              if (colorError) setColorError("");
            }}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <KeyboardHiddenView style={styles.buttonContainer}>
            <Button
              title="Back"
              variant="ghost"
              fullWidth={false}
              centerTextWithLeftIcon
              leftIcon={
                <BackArrowIcon color={theme.text} />
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
          </KeyboardHiddenView>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
}
