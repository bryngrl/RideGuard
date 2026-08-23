// Draft only:

import { Button } from "@/components/ui/button";
import { KeyboardAvoidingWrapper } from "@/components/ui/keyboard-avoiding-wrapper";
import Stepper from "@/components/ui/stepper";
import { CustomTextInput } from "@/components/ui/text-input";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [formData, setFormData] = useState({
    vehicleName: "",
    plateNumber: "",
    color: "",
  });

  const handleSubmit = () => {
    // submit logic here
    console.log("Emergency Info Captured:", formData);
  };
  const handleSkip = () => {
    // skip logic here
    console.log("Data Skipped");
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
            source={require("@/assets/images/logo.png")}
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
              { color: theme.textMuted, marginTop: Spacing.half },
            ]}
          >
            They'll get an SOS text with your location if you trigger an alert or if an attack is detected.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label="Vehicle Name"
            labelStyle={{ color: BrandColors.primary }}
            value={formData.vehicleName}
            onChangeText={(text) =>
              setFormData({ ...formData, vehicleName: text })
            }
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Plate Number"
            labelStyle={{ color: BrandColors.primary }}
            value={formData.plateNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, plateNumber: text })
            }
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <CustomTextInput
            label="Color"
            labelStyle={{ color: BrandColors.primary }}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            containerStyle={{ paddingBottom: Spacing.two }}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Add now"
              variant="primary"
              size="md"
              fullWidth={false}
              style={{ width: "48%", alignSelf: "flex-start" }}
              onPress={handleSubmit}
            />
            <Button
              title="Skip"
              variant="secondary"
              size="md"
              fullWidth={false}
              style={{
                width: "48%",
                borderWidth: 0,
                borderColor: "transparent",
                backgroundColor: "transparent",
              }}
              onPress={handleSkip}
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: Spacing.three,
  },
});
